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
				$request->getParameter('friends'), 
				$request->getParameter('friendsProfiles'),
				$request->getParameter('myProfile')
			);
			/*if ($this->cacheManager) {
				$this->cacheManager->remove('@sf_cache_partial?module=main&action=_total&sf_cache_key=' . date('Ymd') . '_friends');
			}*/
		}
		return $this->returnJSON($result);
	}
	public function executeUploadPhoto(sfWebRequest $request) {
		$server = $request->getParameter('server');
		$method = $request->getParameter('method');
		$params = $request->getParameter('params', array());

		//$filename = $method($params);
		$filename = '@/home/tyaga/zebra.jpg';

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