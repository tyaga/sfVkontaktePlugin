<?php
/**
 * sfVkontakteTools .
 *
 * @package	sfVkontaktePlugin
 * @subpackage tools
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 *
 * usage: $this->getUser()->secure_getBalance( array('uid' => $this->getUser()->id) );
 */

class sfVkontakteTools {
	private static $instance = NULL;

	private $timestamp, $random;

	private function  __construct() {
		//  no use - no unsecure methods
		//		$this->user = sfContext::getInstance()->getUser();
		$this->api_id = sfConfig::get('sf_vkontakte_application_id');
		$this->secret_raw = sfConfig::get('sf_vkontakte_key');
		$this->api_secret = sfConfig::get('sf_vkontakte_secret_key');

		$this->format = sfConfig::get('app_vkontakte_format');
		$this->test_mode = sfConfig::get('app_vkontakte_test_mode');
		$this->vk_url = sfConfig::get('app_vkontakte_api_url');
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
	 * is calling method secure?
	 *
	 * @param string $method
	 * @return boolean
	 */
	private function isSecure($method) {
		return isset($this->methods[$method]['secure']) && $this->methods[$method]['secure'];
	}

	/**
	 * Do method has parameter param?
	 *
	 * @param string $method
	 * @param string $param
	 * @return boolean
	 */
	private function hasParameter($method, $param) {
		return in_array($param, $this->methods[$method]['fields']);
	}

	/**
	 * Is method need POST request?
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
			'api_id' => $this->api_id,
			'v' => $this->api_version,
			'format' => $this->format
		);
		$params = array_merge($prepend, $params);

		if ($this->test_mode) {
			$params = array_merge($params, array('test_mode' => 1));
		}
		if ($this->isSecure($params['method'])) {
			$params = array_merge($params, array('test_mode' => 0));
		}
		// add additional params if secure method
		if ($this->isSecure($params['method'])) {
			if (!($this->timestamp && $this->random)) {
				$this->random = rand(10000, 99999);
				$this->timestamp = time();
			}
			$params = array_merge($params, array('random' => $this->random, 'timestamp' => $this->timestamp));
		}
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
	 * Format signature for query
	 *
	 * @param array $params
	 * @return string
	 */
	private function getSignature($params) {
		//if ($this->isSecure($params['method'])) {
		return md5(implode('', array($this->getParams($params, '', false), $this->api_secret)));
		//}
		//else {
		// no use for unsecure methods
		//return md5(implode('',array($this->user->id, $this->getParams($params, '', false), $this->secret_raw)));
		//}
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
		foreach ($params as $k => $param) {
			if (!$this->hasParameter($method, $k)) {
				throw new sfException('Error, there is no parameter "' . $k . '" in method "' . $method . '" in API');
			}
			// need of POST
			if (!$encodingSafe && $this->isSafeEncParameter($method, $k)) {
				$encodingSafe = true;
			}
		}
		$params = array_merge(array('method' => $method), $params);
		
		$sig = $this->getSignature($params);
		$params = $this->getParams($params, '&', $encodingSafe);

		// get or post query to API
		if ($encodingSafe) {
			$url = $this->vk_url;
			$output = $this->api_call($url, 'POST', array_merge(array('sig' => $sig), $params));
		}
		else {
			$url = $this->vk_url . '?' . $params . '&sig=' . $sig;
			$output = $this->api_call($url, 'GET');
		}
		// reset timestamp and random
		$this->timestamp = $this->random = null;

		if ($this->format == 'JSON') {
			$result = json_decode($output);

			if (!isset($result->response)) {
				throw new sfException('API error: ID=' . $result->error->error_code . ' ' . $result->error->error_msg . '. Params: ' . $params . '. Signature: ' . $sig . '. URL: ' . $url);
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
				throw new sfException('Error: Could not connect to VK API');
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
					throw new sfException('Error: Could not connect to VK API');
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
	private function fgc_call($url, $http_method, $parameters = array()) {
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
		$name = str_replace('_', '.', $name);

		// check method exists
		if (!array_key_exists($name, $this->methods)) {
			throw new sfException('Error, there is no method "' . $name . '" in API');
		}
		return $this->retrieve($name, $arguments);
	}
}
