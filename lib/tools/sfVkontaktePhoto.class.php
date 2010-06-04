<?

class sfVkontaktePhoto {

	public static function getPhoto($params) {
		return "@" . sfConfig::get('sf_root_dir') . sfConfig::get('app_vkontakte_upload_path') . 'test_upload.jpg';
	}
}
