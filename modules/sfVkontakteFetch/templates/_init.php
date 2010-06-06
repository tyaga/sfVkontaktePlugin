<? if (!is_null($sf_user->id) && $sf_user->id): ?>

<script type="text/javascript" language="javascript">
var vkontakte_options = {

	profile_fields: '<?=implode(',', array_keys(sfConfig::get('app_vkontakte_profile_fields')))?>',

	fetch_url: '<?=url_for('@sf_vkontakte_fetch_profiles'); ?>',
	upload_photo_url: '<?=url_for('@sf_vkontakte_upload_photo'); ?>',

	need_fetch: <?=$sf_user->need_fetch?'true':'false'?>
}
</script>

<div id='sf_vkontakte_install' style='display:none;'>Please install Application!</div>
<div id='sf_vkontakte_settings' style='display:none;'>Please set nessesary settings!</div>
<div id='sf_vkontakte_unnessesary_settings' style='display:none;'>Please set settings</div>

<? endif; ?>

