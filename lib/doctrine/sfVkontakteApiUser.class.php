<?php
/**
 * sfVkontakteApiUser doctrine listener  .
 *
 * @package	sfVkontaktePlugin
 * @subpackage doctrine
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class sfVkontakteApiUser extends Doctrine_Template {

	/**
	 * @return
	 */
	public function setTableDefinition() {
		// get columns from app.yml
		$columns = sfConfig::get('app_vkontakte_profile_fields');

		foreach ($columns as $fieldName => $options) {
			if ($options['type'] != 'none') {
				$this->hasColumn($fieldName, $options['type']);
			}
		}
	}
}
