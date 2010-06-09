<?php
/**
 * sfVkontakteSecurityUser user class
 *
 * @package	sfVkontaktePlugin
 * @subpackage user
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontakteSecurityUser extends sfBasicSecurityUser {

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
	 *
	 * @param string $name
	 * @param array $arguments
	 * @return array
	 */
	public function  __call($name, $arguments) {
		return sfVkontakteTools::getInstance()->__call($name, $arguments);
	}

}
