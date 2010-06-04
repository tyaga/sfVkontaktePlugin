<?

class sfFetchHelper {
	public static function setFetchedFriends($me, $profiles, $profile, $settings) {
		$userModelTable = sfConfig::get('app_vkontakte_user_model');

		$fields = array_keys(sfConfig::get('app_vkontakte_profile_fields'));

		// update current user $profile
		foreach ($profile[0] as $field => $value) {
			if (in_array($field, $fields)) {
				$me->$field = $value;
			}
		}
		$me->settings = $settings;
		$me->save();
		if (empty($profiles)) {
			return true;
		}
		// prepare profiles_array
		$profiles_array = array();
		$friendIds = array();
		foreach ($profiles as $profile) {
			$profiles_array[$profile['uid']] = array();
			$friendIds[]=$profile['uid'];
			foreach ($fields as $field) {
				if (isset($profile[$field]) && $profile[$field]!= '') {
					$profiles_array[$profile['uid']][$field] = $profile[$field];
				}
			}
		}
		// prepare users and referenses
		$users = Doctrine_Core::getTable($userModelTable)->createQuery()
				->select()
				->from($userModelTable.' u INDEXBY id')
				->whereIn('id', $friendIds)
				->execute();
		$friendReferences = FriendReferenceTable::getInstance()->createQuery()
				->select()
				->from('FriendReference fr INDEXBY user_to')
				->where('fr.user_from = ? ', $me->id)
				->execute();
		// start transaction
		$conn = Doctrine_Manager::connection();
		$conn->beginTransaction();

		$changed = false;
		foreach($friendIds as $userId) {
			// if there is no user, create one
			$user = isset($users[$userId])?$users[$userId]:false;
			if( !$user) {
				$user = new $userModelTable();
				$user->id = $userId;
				$changed = true;
			}
			// save user data
			$user->fromArray($profiles_array[$user->id]);
			$user->save();
			// if there is no referense, create one and save
			if( !isset($friendReferences[$userId])) {
				$fref = new FriendReference();
				$fref->user_from = $me->id;
				$fref->user_to = $userId;
				$fref->save();
				$changed = true;
			}
		}
		// save fetched_at to current user
		$me->fetched_at = date(DateTime::ATOM);
		$me->save();

		// finish transaction
		$conn->commit();
		
		return $changed;
	}
}