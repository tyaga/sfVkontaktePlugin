<?php
/**
 * sfVkontakteTools .
 *
 * @package	sfVkontaktePlugin
 * @subpackage tools
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 *
 * usage: $this->getUser()->getBalance( array('uid' => $this->getUser()->id) );
 */

class sfVkontakteTools {
	private static $instance = NULL;

	private $timestamp, $random;

	private function  __construct() {
		$this->application_id = sfConfig::get('sf_vkontakte_application_id');
		$this->secret_key = sfConfig::get('sf_vkontakte_secret_key');

		$this->format = sfConfig::get('app_vkontakte_format');
		$this->api_url = sfConfig::get('app_vkontakte_api_url');
		$this->api_version = sfConfig::get('app_vkontakte_api_version');

		$this->methods = sfConfig::get('app_vkontakte_methods');
	}

	/**
	 *
	 * @return sfVkontakteTools
	 */
	public static function getInstance() {
		if (self::$instance == NULL) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Do method needs POST request?
	 *
	 * @param string $method
	 * @param string $param
	 * @return boolean
	 */
	private function isSafeEncParameter($method, $param) {
		$text_fields = isset($this->methods[$method]['text_fields']) ? array_flip($this->methods[$method]['text_fields']) : array();
		return isset($text_fields[$param]);
	}

	/**
	 * Returns params
	 * if need safeEncoding - return array
	 * otherwise - flat GET query string
	 *
	 * @param array $params
	 * @param string $delimeter
	 * @return string
	 */
	private function getParams($params, $delimeter = '&', $return_array = false) {
		$prepend = array(
			'api_id' => $this->application_id,
			'v' => $this->api_version,
			'format' => $this->format
		);
		$params = array_merge($prepend, $params);

		// add additional params if secure method
		if (!($this->timestamp && $this->random)) {
			$this->random = rand(10000, 99999);
			$this->timestamp = time();
		}
		$params = array_merge($params, array('random' => $this->random, 'timestamp' => $this->timestamp));
		// sort by name
		ksort($params);

		if ($return_array) {
			return $params;
		}
		// array of k=v
		$output = array();
		foreach ($params as $k => $param) {
			$output[] = $k . '=' . $param;
		}
		// implode (with '&' if nessesary)
		return implode($delimeter, $output);
	}

	/**
	 * perform method call
	 *
	 * @param string $method
	 * @param array $params
	 * @return array
	 */
	private function retrieve($method, $params = array()) {
		$encodingSafe = false;
		// check field exists and need of POST method
		$checkMethod = str_replace('secure.', '', $method);
		foreach ($params as $k => $param) {
			if (!in_array($k, $this->methods[$checkMethod]['fields'])) {
				throw new sfException('Error, there is no parameter "' . $k . '" in method "' . $checkMethod . '" in API');
			}
			// need of POST
			if (!$encodingSafe && $this->isSafeEncParameter($checkMethod, $k)) {
				$encodingSafe = true;
			}
		}
		$params = array_merge(array('method' => $method), $params);

		$sig = md5(implode('', array($this->getParams($params, '', false), $this->secret_key)));
		$params = $this->getParams($params, '&', $encodingSafe);

		// get or post query to API
		if ($encodingSafe) {
			$url = $this->api_url;
			$output = $this->api_call($url, 'POST', array_merge(array('sig' => $sig), $params));
		}
		else {
			$url = $this->api_url . '?' . $params . '&sig=' . $sig;
			$output = $this->api_call($url, 'GET');
		}
		// reset timestamp and random
		$this->timestamp = $this->random = null;

		if ($this->format == 'JSON') {
			$result = json_decode($output);

			if (!isset($result->response)) {
				$paramsStr = '';
				foreach($params as $k=>$param){
					$paramsStr .= "\nk=" . $k . '=' . $param;
				}
				throw new sfException('API error: ID=' . $result->error->error_code . ' ' . $result->error->error_msg . ".\n\n Params: " . $paramsStr . '. Signature: ' . $sig . ".\n\n URL: " . $url);
			}
			return $result->response;
		}
		else {
			return $output;
		}
	}

	/**
	 * perform http call
	 *
	 * @param string $request
	 * @return string
	 */
	private function api_call($url, $method, $parameters = array()) {
		// check function exists
		if ($method == 'POST') {
			if (!function_exists('curl_init')) {
				throw new sfException('Error: Could not connect to VK API - no CURL installed');
			}
			return $this->curl_call($url, 'POST', $parameters);
		}
		else {
			if (function_exists('curl_init')) {
				return $this->curl_call($url);
			}
			else {
				if (ini_get('allow_url_fopen')) {
					return $this->fgc_call($url);
				}
				else {
					throw new sfException('Error: Could not connect to VK API - no URL_FOPEN enabled');
				}
			}
		}
	}

	/**
	 * perform CURL call
	 *
	 * @param string $url
	 * @param POST|GET $http_method
	 * @param array|string $parameters
	 * @return string
	 */
	private function curl_call($url, $http_method = 'GET', $parameters = array()) {
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_HEADER, 0);

		if ($http_method == 'POST') {
			curl_setopt($ch, CURLOPT_POST, true);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $parameters);
		}

		$output = curl_exec($ch);
		curl_close($ch);
		return $output;
	}

	/**
	 * perform file_get_contents call
	 *
	 * @param string $url
	 * @param POST|GET $http_method
	 * @param array|string $parameters
	 * @return string
	 */
	private function fgc_call($url, $http_method = 'GET', $parameters = array()) {
		return file_get_contents($url);
	}

	/**
	 * public call
	 * @param string $name
	 * @param array $arguments
	 * @return array
	 */
	public function  __call($name, $arguments) {
		// todo: fix double __call 
		$_arguments = array();
		foreach ($arguments as $arg) {
			$_arguments = $arg;
		}
		$arguments = $_arguments;

		// workaround on method name
		$callName = 'secure.'.$name;

		// check method exists
		if (!array_key_exists($name, $this->methods)) {
			throw new sfException('Error, there is no method "' . $name . '" in API');
		}
		return $this->retrieve($callName, $arguments);
	}
}
