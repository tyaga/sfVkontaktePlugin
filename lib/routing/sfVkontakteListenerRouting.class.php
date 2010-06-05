<?
/**
 * sfVkontakteListenerRouting .
 *
 * @package	sfVkontaktePlugin
 * @subpackage routing
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontakteListenerRouting {
	/**
	 * Listens to the routing.load_configuration event.
	 *
	 * @param sfEvent An sfEvent instance
	 * @static
	 */
	static public function listenToRoutingLoadConfigurationEvent(sfEvent $event) {
		// preprend our routes
		if (sfConfig::get('app_vkontakte_enable_register_routes')) {
			$event->getSubject()->prependRoute('sf_vkontakte_fetch_profiles',
				new sfRoute('/sf_vkontakte_fetch_profiles',
					array('module' => 'sfVkontakteFetch', 'action' => 'profiles')));
			$event->getSubject()->prependRoute('sf_vkontakte_upload_photo',
				new sfRoute('/sf_vkontakte_upload_photo',
					array('module' => 'sfVkontakteFetch', 'action' => 'uploadPhoto')));
		}
	}
}
