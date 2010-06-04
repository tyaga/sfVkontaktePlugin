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
			// get or create model user
			$this->user = UserTable::getInstance()->findOneById($this->getUser()->id);
			if (!$this->user) {
				$this->user = new User();
				$this->user->id = $this->getUser()->id;
				$this->user->save();
			}
			// if we need to fetch profiles
			$this->getUser()->need_fetch = $this->user->fetched_at < date('Y-m-d');
		}

		sfContext::getInstance()->getResponse()->addJavascript('http://vkontakte.ru/js/api/xd_connection.js?2', 'first');
		// add JS to response
/*		if (sfConfig::get('sf_debug')) {
			sfContext::getInstance()->getResponse()->addJavascript('/sfVkontaktePlugin/js/lib/vk-jsapi/vk_api.js', 'first');
		}
		else {
			sfContext::getInstance()->getResponse()->addJavascript('/sfVkontaktePlugin/js/lib/vk-jsapi/vk_api.min.js', 'first');
		}*/
		sfContext::getInstance()->getResponse()->addJavascript('/sfVkontaktePlugin/js/common.js', 'first');

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