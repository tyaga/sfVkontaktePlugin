<? if (!is_null($sf_user->id) && $sf_user->id): ?>

<script type="text/javascript" language="javascript">
	App.encrypted_key = '<?=sfConfig::get('sf_vkontakte_encrypted_key')?>';
	App.profile_fields = '<?=implode(',', array_keys(sfConfig::get('app_vkontakte_profile_fields')))?>';
	App.fetch_url = '<?=url_for('@sf_vkontakte_fetch_profiles'); ?>';
	App.upload_photo_url = '<?=url_for('@sf_vkontakte_upload_photo'); ?>';
	App.need_fetch = <?=$sf_user->need_fetch?'true':'false'?>;
</script>

<div id='allow-unnessesary-settings' style='display:none;'>Allow unnessesary settings</div>

<!--<div id='vk_api_msgbox'>Пожалуйста, установите приложение!</div>-->

<? endif; ?>
