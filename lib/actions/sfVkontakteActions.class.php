<?
/**
 * sfVkontakteActions actions class.
 *
 * @package	sfVkontaktePlugin
 * @subpackage actions
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */
class sfVkontakteActions extends sfActions {
	/**
	 * @return
	 */
	public function preExecute() {
		if ($this->getUser()->id) {
			// get or create model sfVkontakteUser
			$this->vkontakteUser = sfVkontakteUserTable::getInstance()->find($this->getUser()->id);
			if (!$this->vkontakteUser) {
				$this->vkontakteUser = new sfVkontakteUser();
				$this->vkontakteUser->id = $this->getUser()->id;
				$this->vkontakteUser->save();
			}
			// if we need to fetch profiles
			$this->getUser()->need_fetch = sfConfig::get('app_vkontakte_enable_fetch') && $this->vkontakteUser->getNeedFetchFriends();
		}
		if (sfConfig::get('app_vkontakte_enable_add_js')) {
			// add JS to response
			sfContext::getInstance()->getResponse()->addJavascript('http://vkontakte.ru/js/api/xd_connection.js?2', 'first');
			sfContext::getInstance()->getResponse()->addJavascript('/sfVkontaktePlugin/js/common.js', 'first');
		}

		parent::preExecute();
	}

	public function returnJSON($data) {
		$json = json_encode($data);

		if (sfConfig::get('sf_debug') && !$this->getRequest()->isXmlHttpRequest()) {
			$this->getContext()->getConfiguration()->loadHelpers('Partial');
			$this->renderText(get_partial('sfVkontakteFetch/jsonDebug', array('data' => $data , 'json' => $json)));
		} else {
			$this->getResponse()->setHttpHeader('Content-type', 'application/json');
			$this->renderText($json);
		}
		return sfView::NONE;
	}
}