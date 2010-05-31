<?
/**
 * sfVkontaktePatternRouting .
 *
 * @package	sfVkontaktePlugin
 * @subpackage routing
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontaktePatternRouting extends sfPatternRouting {
	public function generate($name, $params = array(), $absolute = false) {
		return parent::generate($name, $params, $absolute) . '?' . $_SERVER['QUERY_STRING'];
	}
}