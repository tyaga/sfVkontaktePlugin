<script type="text/javascript" language="javascript">
var vkontakte_options = {
	profile_fields: '<?=implode(',', array_keys(sfConfig::get('app_vkontakte_profile_fields')))?>',
	fetch_url: '<?=url_for('@sf_vkontakte_fetch_profiles'); ?>',
	upload_photo_url: '<?=url_for('@sf_vkontakte_upload_photo'); ?>',
	need_fetch: <?=($sf_user->id && $sf_user->need_fetch)?'true':'false'?>,
	application_id: "<?=sfConfig::get('sf_vkontakte_application_id');?>"
}
</script>
