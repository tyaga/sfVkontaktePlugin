<?php
/**
 * sfVkontaktePluginConfiguration
 *
 * @package	sfVkontaktePlugin
 * @subpackage configuration
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontaktePluginConfiguration extends sfPluginConfiguration {
	public function initialize() {
		if (in_array('sfVkontakteFetch', sfConfig::get('sf_enabled_modules', array()))) {
			$this->dispatcher->connect('routing.load_configuration', array('sfVkontakteListenerRouting', 'listenToRoutingLoadConfigurationEvent'));
		}

	}
}
