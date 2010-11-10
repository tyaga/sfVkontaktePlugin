<?php

class sfFetchHelper {
	public static function setFetchedFriends($me, $profiles, $profile, $settings) {

		$db = Doctrine_Manager::getInstance()->getCurrentConnection();
		$fields = array_keys(sfConfig::get('app_vkontakte_profile_fields'));
		foreach ($fields as $k=>$field) {
			// remove unused fields
			if ($field == 'contacts' || $field == 'education') {
				unset($fields[$k]);
			}
		}

		// update current user $profile
		foreach ($profile[0] as $field => $value) {
			if (in_array($field, $fields)) {
				$me->$field = $value;
			}
		}
		// set settings and fetched_at
		$me->settings = $settings;
		$me->fetched_at = date(DateTime::ATOM);
		$me->save();

		// prepare profiles_array
		// fill it with fields
		$profilesArray = array();
		$fetchedFriendIds = array();
		foreach ($profiles as $profile) {
			$profilesArray[$profile['uid']] = array();
			$fetchedFriendIds[] = $profile['uid'];
			foreach ($fields as $field) {
				if (isset($profile[$field]) && $profile[$field] != '') {
					$profilesArray[$profile['uid']][$field] = $profile[$field];
				}
				else {
					$profilesArray[$profile['uid']][$field] = '';
				}
			}
		}
		// select current friends
		$friends = $db->fetchAll('SELECT DISTINCT fr.user_to FROM sf_vkontakte_friendship fr WHERE fr.user_from = :current_user_id ',
			array('current_user_id'=>$me->id));
		$friendsIds = array();
		foreach ($friends as $friend) {
			$friendsIds[] = $friend['user_to'];
		}

		// insert other users
		if (count($profilesArray)) {
			$values = array();
			foreach ($profilesArray as $id=>$profile) {
				$value = array();
				foreach ($profile as $v) {
					$value[] = $db->quote($v);
				}
				$value[] = $db->quote(date(DateTime::ATOM));
				$value[] = $db->quote(date(DateTime::ATOM));

				$values[] = $db->quote($id) . ", " . implode(",", $value);
			}

			$qNewUsers = 'INSERT INTO sf_vkontakte_user (id,  ' . implode(',', $fields) . ', created_at, updated_at)
				VALUES (' . implode("),\n(", $values) . ')';
			$qNewUsers .= ' ON DUPLICATE KEY UPDATE ';

			// first_name = VALUES(first_name), ....
			$fieldsStr = array();
			foreach ($fields as $f) {
				$fieldsStr[] = $f . ' = VALUES(' . $f . ')';
			}
			$qNewUsers .= implode(', ', $fieldsStr) . ', updated_at = VALUES(updated_at)';

			$db->execute($qNewUsers);
		}

		$toAdd = array_diff($fetchedFriendIds, $friendsIds);
		$toDelete = array_diff($friendsIds, $fetchedFriendIds);

		if (count($toDelete)) {
			// delete removed friendship
			$db->execute('DELETE FROM sf_vkontakte_friendship
				WHERE user_to = :user_id AND user_from IN (' . implode(',', $toDelete) . ')', array('user_id' => $me->id));
			$db->execute('DELETE FROM sf_vkontakte_friendship
				WHERE user_from = :user_id AND user_to IN (' . implode(',', $toDelete) . ')', array('user_id' => $me->id));
		}
		// insert friendship
		if (count($toAdd)) {
			$qFriendship = 'INSERT IGNORE INTO sf_vkontakte_friendship (user_from, user_to, created_at, updated_at) VALUES ';
			$q = array();
			foreach ($toAdd as $friend) {
				$q[]= '(' . $me->id . ', ' . $db->quote($friend) . ', '.$db->quote(date(DateTime::ATOM)).', '.$db->quote(date(DateTime::ATOM)).'), '.
					'(' . $db->quote($friend) . ', ' . $me->id. ', '.$db->quote(date(DateTime::ATOM)).', '.$db->quote(date(DateTime::ATOM)).') ';
			}
			$qFriendship .= implode(', ',$q);

			$db->execute($qFriendship);
		}
		return true;
	}
}