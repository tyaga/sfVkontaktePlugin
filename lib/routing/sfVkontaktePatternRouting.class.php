<?php
/**
 * sfVkontaktePatternRouting .
 *
 * @package	sfVkontaktePlugin
 * @subpackage routing
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontaktePatternRouting extends sfPatternRouting {
	public function generate($name, $params = array(), $absolute = false) {
		return sfConfig::get('app_vkontakte_enable_append_get_params')?
				(parent::generate($name, $params, $absolute) . '?' . $_SERVER['QUERY_STRING']):
				(parent::generate($name, $params, $absolute));
	}
}