<script type="text/javascript" language="javascript">
var vkontakte_options = {
	profile_fields: '<?php echo implode(',', array_keys(sfConfig::get('app_vkontakte_profile_fields')))?>',
	fetch_url: '<?php echo url_for('@sf_vkontakte_fetch_profiles'); ?>',
	upload_photo_url: '<?php echo url_for('@sf_vkontakte_upload_photo'); ?>',
	need_fetch: <?php echo ($sf_user->id && $sf_user->need_fetch)?'true':'false'?>,
	application_id: "<?php echo sfConfig::get('sf_vkontakte_application_id');?>"
}
</script>
