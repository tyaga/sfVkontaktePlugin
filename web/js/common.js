/**
 * App
 *
 * @package	sfVkontaktePlugin
 * @subpackage js lib
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */
DEBUG = true;
API = {
	SETT_NOTIFY	   :    1, //allow to send notifications
	SETT_FRIENDS   :    2, //add access to friends
	SETT_PHOTOS    :    4, //add access to photos
	SETT_AUDIO     :    8, //add access to audio
	SETT_OFFER     :   32, //add access to offers
	SETT_QUESTIONS :   64, //add access to questions
	SETT_WIKI      :  128, //add access to Wiki-pages
	SETT_MENU      :  256, //add access to left menu
	SETT_WALL      :  512, //add access to user wall
	SETT_STATUS    : 1024  //add access to user status
};

App = {
	User: null,
	need_fetch: false,
	profile_fields: null,

	mandatory_settings: API.SETT_FRIENDS | API.SETT_NOTIFY | API.SETT_WALL,
	unnessesary_settings: API.SETT_PHOTOS | API.SETT_MENU,

	install_element: '#sf_vkontakte_install',
	mandatory_settings_element: '#sf_vkontakte_settings',
	unnessesary_settings_element: '#sf_vkontakte_unnessesary_settings',

	after_create: null,
	after_fetch_friends_done: function() {},
	after_fetch_friends_not: function() {},

	create: function(after_create /*, after_fetch_friends_done, after_fetch_friends_not */) {
		log('create');
		App.after_create = after_create;
		if ((arguments.length >= 2) && (typeof arguments[1] == 'function')) {
			App.after_fetch_friends_done = after_fetch_friends_done;
		}
		if ((arguments.length >= 3) && (typeof arguments[2] == 'function')) {
			App.after_fetch_friends_not = after_fetch_friends_not;
		}
		VK.init(function() {
			VK.loadParams(document.location.href);
			App.init();
		});
	},
	init: function() {
		log('init');
		if (VK.params.is_app_user != 0) {
			App.run();
		}
		else {
			App.install();
		}
	},
	run: function() {
		log('run');
		App.check_settings(function() {
			App.fetch_profile(function() {
				log('Preload has done, do run App');
				App.after_create();
			});
		});
	},
	check_settings: function(callback) {
		log('check settings');
		// get settings
		if (!Tools.check_settings(VK.params.api_settings, App.unnessesary_settings)) {
			log("Wrong unnessesary settings, show link");
			$(App.unnessesary_settings_element).click(function() {
				VK.callMethod('showSettingsBox',App.unnessesary_settings);
			}).show();
			App.bind_and_do_if_settings_ok(App.unnessesary_settings, function() {
				$(App.unnessesary_settings_element).hide();
			});
		}
		if (Tools.check_settings(VK.params.api_settings, App.mandatory_settings)) {
			log('Mandatory settings are OK, go forward');
			callback();
		}
		else {
		log("Wrong mandatory settings, can't run");
			App.bind_and_do_if_settings_ok(App.mandatory_settings, function() {
				App.run();
			});
			App.make_settings(App.mandatory_settings);
		}
	},
	make_settings: function(settings) {
		if (!Tools.check_settings(VK.params.api_settings, settings)) {
			App.show_message(App.mandatory_settings_element, function(){ VK.callMethod("showSettingsBox", settings); });
			VK.callMethod("showSettingsBox", settings);
		}
		VK.addCallback('onSettingsChanged',
			function(new_settings) {
				VK.params.api_settings = new_settings;
				if (Tools.check_settings(VK.params.api_settings, settings)) {
					App.hide_message(App.mandatory_settings_element);
				}
			}
		);
	},
	make_install: function(callback) {
		if (VK.params.is_app_user == 0) {
			App.show_message(App.install_element, function(){ VK.callMethod('showInstallBox'); });
			VK.addCallback('onApplicationAdded', function() {
				VK.params.is_app_user = 1;
				App.hide_message(App.install_element);
				callback();
				VK.callMethod('showInstallBox');
			});
		}
		else {
			callback();
		}
	},
	show_message: function(id, onclick){
		$(id).show().click(onclick);
	},
	hide_message: function(id){
		$(id).hide();
	},
	fetch_profile: function(callback) {
		if (App.need_fetch) {
			log('fetch profile and friends');
			var fields_param = '"fields": "' + App.profile_fields + '"';
			var code =
			'var friends = API.getFriends();' +
			'var friendsProfiles = API.getProfiles({"uids": friends, ' + fields_param + '});' +
			'var myProfile = API.getProfiles({"uids": ' + VK.params.viewer_id + ', ' + fields_param + '});' +
			'return {"friends": friends, "friendsProfiles": friendsProfiles, "myProfile": myProfile };';

			VK.api('execute', {'code': code}, function(data) {
				App.User = data.response.myProfile[0];
				log("Friends and profiles fetched, tryng to send");
				$.post(App.fetch_url, data.response, function(result) {
					if (result) {
						log("Profiles sent, call callback done");
						App.after_fetch_friends_done();
					}
					else {
						log("Profiles sent, but hasn't saved, call callback not need to save");
						App.after_fetch_friends_not();
					}
					callback();
				})
			});
		}
		else {
			log('fetch profile');
			VK.api('getProfiles', { uids: VK.params.viewer_id, fields: App.profile_fields}, function(data){
				App.User = data.response[0];
				callback();
			});
		}

	},
	install: function() {
		log('install');
		App.make_install(function() {
			App.bind_and_do_if_settings_ok(App.mandatory_settings, function() {
				App.run();
			});
			App.make_settings(App.mandatory_settings);
		});
	},
	bind_and_do_if_settings_ok: function(need_settings, callback) {
		VK.addCallback('onSettingsChanged', function(current_settings) {
			log('Settings changed');
			if (Tools.check_settings(current_settings, need_settings)) {
				log('Changed settings are OK, run callback');
				callback();
			}
		});
	}
};

Upload = {
	upload_server: null,
	album_id: null,
	upload_result: null,
	mode: null,
	album_title: null,
	wall_id: null,
	server_method: null,
	upload_file_params: null,

	photo: function(album_title, server_method, upload_file_params, post_photo) { log('Upload.photo');
		if (album_title != '' && server_method != '') {
			Upload.album_title = album_title;
			Upload.server_method = server_method;
			Upload.upload_file_params = upload_file_params;
		}
		
		Upload.mode = 'photo';
		Upload.post(function(){
			post_photo();
		});
	},
	wall: function(message, wall_id, server_method, upload_file_params, post_post_wall) { log('Upload.wall');
		Upload.server_method = server_method;
		Upload.upload_file_params = upload_file_params;

		Upload.message = message;
		Upload.wall_id = wall_id;
		
		Upload.mode = 'wall';
		Upload.post(function(){
			Upload.post_wall(function(){
				post_post_wall();
			});
		});
	},
	post: function(post_post) { log('Upload.post');
		var upload_chain = function() {
			Upload.get_server(function(){
				Upload.upload_photo(function(){
					Upload.save_photo(function(){
						post_post();
					});
				});
			});
		};

		switch(Upload.mode) {
			case 'wall':
				upload_chain();
				break;
			case 'photo':
				Upload.find_album(function() {
					upload_chain();
				});
				break;
		}
	},
	find_album: function(after_find_album) { log('Upload.find_album');
		VK.api( 'photos.getAlbums' , {}, function(data) {
			if (data.response) {
				log('Try to recognize an album');
				Upload.album_id = false;
				for(var t in data.response) {
					if (data.response[t]['title'] == Upload.album_title) {
						Upload.album_id = data.response[t]['aid'];
						break;
					}
				}
				if (!Upload.album_id) {
					log('Cant find an album, try to create album');
					VK.api( 'photos.createAlbum', {'title': Upload.album_title}, function(data) {
						log('Album created');
						Upload.album_id = data.response['aid'];
						after_find_album();
					});
				}
				else {
					log('Album finded ' + Upload.album_id);
					after_find_album();
				}
			}
			else {
				log('Error while fetching albums');
			}
		});
	},
	get_server: function(after_get_server) { log('Upload.get_server');
		switch(Upload.mode) {
			case 'wall': var method = 'wall.getPhotoUploadServer'; var params = {}; break;
			case 'photo': var method = 'photos.getUploadServer'; var params = {'aid': Upload.album_id}; break;
		}
		VK.api(method, params, function(data) {
			if (data.response) {
				log("Server fetched");
				Upload.upload_server = data.response.upload_url;
				after_get_server();
			}
			else {
				log("Error while fetching server");
			}
		});
	},
	upload_photo: function(after_upload_photo) { log('Upload.upload_photo');
		$.post(App.upload_photo_url,
		{	server: Upload.upload_server,
			method: Upload.server_method,
			params: Upload.upload_file_params,
			mode: Upload.mode
		},
		function(data) {
			log('Photo has uploaded to vk, callback');
			Upload.upload_result = data;
			after_upload_photo();
		});
	},
	save_photo: function(after_save_photo) {  log('Upload.save_photo');
		switch( Upload.mode ) {
			case 'wall':
				var method = 'wall.savePost';
				var params = Upload.upload_result;
				params.message = Upload.message;
				params.wall_id = Upload.wall_id;
				break;
			case 'photo':
				var method = 'photos.save';
				var params = Upload.upload_result;
				break;
		}

		VK.api( method, params, function(data) {
			if (data.response) {
				log('Photo saved, do callback');

				if (Upload.mode == 'wall') {
					Upload.post_hash = data.response.post_hash;
				}

				after_save_photo();
			}
			else {
				log('Cant save photo');
			}
		});
	},
	post_wall: function(after_post_wall) {  log('Upload.post_wall');
		VK.addCallback('onWallPostSave', function() {
			log('Post wall success, do callback');
			after_post_wall();
		});
		VK.addCallback('onWallPostCancel', function() {
			log('Post wall cancel');
		});
		VK.callMethod('saveWallPost', Upload.post_hash);
	}
};

Tools = {
	timer: new Date().getTime(),
	check_settings: function(current_settings, need_settings) {
		return (current_settings & need_settings) == need_settings;
	},
	log: function (msg) {
		var elapsed = (new Date().getTime() - Tools.timer);
		var date = new Date(elapsed);
		msg = '[' + date.getSeconds() + '.' + date.getMilliseconds() + '] ' +  msg ;
		if (DEBUG) {
			if (undefined !== window.console) {
				console.log(msg);
			}
			else {
				//$('body').append('<div>'+msg+'</div>');
			}
		}
	}
};
log = Tools.log;
