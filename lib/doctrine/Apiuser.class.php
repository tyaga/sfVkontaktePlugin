<?
/**
 * Apiuser doctrine listener  .
 *
 * @package	sfVkontaktePlugin
 * @subpackage doctrine
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

class Apiuser extends Doctrine_Template {

	/**
	 * @return
	 */
	public function setTableDefinition() {
		// get columns from app.yml
		$columns = sfConfig::get('app_vkontakte_profile_fields');

		foreach ($columns as $fieldName => $options) {
			$this->hasColumn($fieldName, $options['type']);
		}
		$this->hasColumn('fetched_at', 'datetime');
	}
	public function setUp() {
		$this->hasMany('User as Friends', array(
			'local' => 'user_from',
			'foreign' => 'user_to',
			'refClass' => 'FriendReference',
			'equal'  => true
		));
		//$this->
		//$this->_options['table'];
	}
}

//class FriendReference extends Doctrine_Record {
//    public function setTableDefinition() {
//        $this->hasColumn('user_from', 'integer', null, array('primary'=>true));
//        $this->hasColumn('user_to', 'integer', null, array('primary'=>true));
//    }
//}