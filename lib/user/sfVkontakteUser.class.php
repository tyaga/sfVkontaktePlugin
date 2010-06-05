<?php
/**
 * sfVkontakteUser user class
 *
 * @package	sfVkontaktePlugin
 * @subpackage user
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontakteUser extends sfBasicSecurityUser {

	public $id = null;
	public $need_fetch = false;

	public function initialize(sfEventDispatcher $dispatcher, sfStorage $storage, $options = array()) {
		parent::initialize($dispatcher, $storage, $options);
		$request = sfContext::getInstance()->getRequest();

		// check auth by api_secret and get parameters
		$isAuth = md5(implode('_', array(
			$request->getParameter('api_id'),
			$request->getParameter('viewer_id'),
			sfConfig::get('sf_vkontakte_secret_key')
		))) == $request->getParameter('auth_key');

		$this->setAuthenticated($isAuth);
		if ($isAuth) {
			$this->id = $request->getParameter('viewer_id');
		}
	}
	/**
	 * if we need to fetch profiles
	 * @param  $user
	 * @return bool
	 */
	public function getNeedFetch($user) {
		return $user->fetched_at < date('Y-m-d');
	}
	/**
	 *
	 * @param string $name
	 * @param array $arguments
	 * @return array
	 */
	public function  __call($name, $arguments) {
		return sfVkontakteTools::getInstance()->__call($name, $arguments);
	}
/*	public function upload_photo($filename, $server) {
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
		curl_setopt($ch, CURLOPT_URL, $server);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, array('file1' => $filename));
		$res = curl_exec ($ch);
		curl_close ($ch);
		return $res;
	}*/
}
