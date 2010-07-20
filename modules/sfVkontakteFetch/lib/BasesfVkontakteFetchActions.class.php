<?php

class BasesfVkontakteFetchActions extends sfVkontakteActions {
	public function executeProfiles(sfWebRequest $request) {
		$result = false;
		if ($this->getUser()->need_fetch) {
			$result = sfFetchHelper::setFetchedFriends( $this->vkontakteUser,
				$request->getParameter('friendsProfiles', array()),
				$request->getParameter('myProfile', array()),
				$request->getParameter('settings', null)
			);
		}
		return $this->returnJSON($result);
	}
	public function executeUploadPhoto(sfWebRequest $request) {
		if (!function_exists('curl_init')) {
			return $this->returnJSON(array('error'=> 'curl is not installed'));
		}

		$server = $request->getParameter('server');
		$method = $request->getParameter('method', '');
		$params = $request->getParameter('params', array());
		$mode = $request->getParameter('mode');

		$this->forward404Unless($server && $mode);

		$filename = call_user_func(array(sfConfig::get('app_vkontakte_photo_getter_class'), $method), $params);

		if ($mode == 'photo') {
			$paramname = 'file1';
		}
		elseif($mode == 'wall') {
			$paramname = 'photo';
		}

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
		curl_setopt($ch, CURLOPT_URL, $server);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, array($paramname => $filename));
		$result = curl_exec($ch);
		$error = curl_error($ch);
		curl_close ($ch);

		if (!$result) {
			return $this->returnJSON(array('error'=> 'Curl error: ' . $error));
		}

		$result = json_decode($result);
		$resultToReturn = array( 'response' => $result );

		if ($mode == 'photo') {
			if ($result->server == '' || $result->photos_list == '' || $result->aid == '' || $result->hash == '') {
				$resultToReturn = array( 'error' => json_decode($result) );
			}
		}
		elseif($mode == 'wall') {
			if ($result->server == '' || $result->photo == '' || $result->hash == '') {
				$resultToReturn = array( 'error' => json_decode($result) );
			}
		}
		return $this->returnJSON($resultToReturn);
	}
}