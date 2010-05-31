<?

class sfFetchHelper {
	public static function setFetchedFriends($user, $friendIds, $profiles, $profile) {
		$fields = array_keys(sfConfig::get('app_vkontakte_profile_fields'));

		// обновить пользователя $profile
		foreach ($profile[0] as $field => $value) {
			if (in_array($field, $fields)) {
				$user->$field = $value;
			}
		}
		$user->save();

		$profiles_array = array();
		foreach ($profiles as $profile) {

			$profiles_array[$profile['uid']] = array();
			foreach ($fields as $field) {
				if (isset($profile[$field]) && $profile[$field]!= '') {
					$profiles_array[$profile['uid']][$field] = $profile[$field];
				}
			}
		}
		$changed = false;
		foreach($friendIds as $userId) {
			$user = UserTable::getInstance()->findOneById($userId);
			if( !$user) {
				$user = new User();
				$user->id = $userId;
				$user->save();
				$changed = true;
			}
			$user->fromArray($profiles_array[$user->id]);
			$user->save();

			$fref1 = FriendReferenceTable::getInstance()->createQuery()
				->where('user_from = ? ', $user->id)
				->andWhere('user_to = ?', $userId)
				->fetchOne();

			if( !$fref1 ) {
				$fref = new FriendReference();
				$fref->user_from = $user->id;
				$fref->user_to = $userId;
				$fref->save();
				$changed = true;
			}
		}
		$user->fetched_at = date(DateTime::ATOM);
		$user->save();

		return $changed;
	}
}