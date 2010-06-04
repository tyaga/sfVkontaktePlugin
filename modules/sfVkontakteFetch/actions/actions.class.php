<?
/**
 * sfVkontakteFetchActions
 *
 * @package	sfVkontaktePlugin
 * @subpackage user
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontakteFetchActions extends sfVkontakteActions {
	public function executeProfiles(sfWebRequest $request) {
		$result = false;
		if ($this->getUser()->need_fetch) {
			$result = sfFetchHelper::setFetchedFriends( $this->user,
				$request->getParameter('friendsProfiles', array()),
				$request->getParameter('myProfile', array()),
				$request->getParameter('settings', null)
			);
		}
		return $this->returnJSON($result);
	}
	public function executeUploadPhoto(sfWebRequest $request) {
		$server = $request->getParameter('server');
		$method = $request->getParameter('method');
		$params = $request->getParameter('params', array());

		$filename = sfVkontaktePhoto::$method($params);
		if ($request->getParameter('mode') == 'photo') {
			$paramname = 'file1';
		}
		elseif($request->getParameter('mode') == 'wall') {
			$paramname = 'photo';
		}

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
		curl_setopt($ch, CURLOPT_URL, $server);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, array($paramname => $filename));
		$result = curl_exec ($ch);
		curl_close ($ch);
		
		return $this->returnJSON(json_decode($result));
	}
}