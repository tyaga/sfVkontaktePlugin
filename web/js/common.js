/**
 * App
 *
 * @package	sfVkontaktePlugin
 * @subpackage js lib
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */

DEBUG = true;
App = {
	api: null,
	encrypted_key: null,

	need_fetch: false,
	profile_fields: null,

	mandatory_settings: 'api.SETT_FRIENDS | api.SETT_NOTIFY | api.SETT_WALL',
	unnessesary_settings: 'api.SETT_PHOTOS | api.SETT_MENU',

	unnessesary_settings_element: '#allow-unnessesary-settings',
	mandatory_settings_element: '#allow-mandatory-settings',

	after_create: function() {
	},
	after_fetch_friends_done: function() {
	},
	after_fetch_friends_not: function() {
	},

	create: function(after_create /*, after_fetch_friends_done, after_fetch_friends_not */) {
		log('create');
		if (App.encrypted_key != '') {
			App.after_create = after_create;
			if ((arguments.length >= 2) && (typeof arguments[1] == 'function')) {
				App.after_fetch_friends_done = after_fetch_friends_done;
			}
			if ((arguments.length >= 3) && (typeof arguments[2] == 'function')) {
				App.after_fetch_friends_not = after_fetch_friends_not;
			}
			
			api = new vk_api(App.encrypted_key, App.init, function(){ log('startup error'); });
		}
		else {
			log("No encrypted_key param, can't start");
		}
	},

	init: function() {
		log('init');
		eval('App.mandatory_settings = ' + App.mandatory_settings);
		eval('App.unnessesary_settings = ' + App.unnessesary_settings);
		if (api.params.is_app_user != 0) {
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
				log('Preload is done, do run App');
				App.after_create();
			});
		});
	},

	check_settings: function(callback) {
		log('check settings');
		// get settings
		api.call('getUserSettings', {}, function(current_settings) {
			log('Do get settings and check them');

			if (!Tools.check_settings(current_settings.response, App.unnessesary_settings)) {
				log("Wrong unnessesary settings, show link");
				$(App.unnessesary_settings_element).click(function() {
					api.external.showSettingsBox(App.unnessesary_settings);
				}).show();
				App.bind_and_do_if_settings_ok(App.unnessesary_settings, function() {
					$(App.unnessesary_settings_element).hide();
				});
			}
			if (Tools.check_settings(current_settings.response, App.mandatory_settings)) {
				log('Mandatory settings are OK, go forward');

				callback();

			}
			else {
				log("Wrong mandatory settings, can't run");
				App.bind_and_do_if_settings_ok(App.mandatory_settings, function() {
					App.run();
				});
				api.makeSettings(App.mandatory_settings);
			}
		});
	},

	fetch_profile: function(callback) {
		log('fetch profile and friends');
		if (App.need_fetch) {
			var fields_param = '"fields": "' + App.profile_fields + '"';
			var code =
			'var friends = API.getFriends();' +
			'var friendsProfiles = API.getProfiles({"uids": friends, ' + fields_param + '});' +
			'var myProfile = API.getProfiles({"uids": ' + api.params.viewer_id + ', ' + fields_param + '});' +
			'return {"friends": friends, "friendsProfiles": friendsProfiles, "myProfile": myProfile };';

			api.call('execute', {'code': code}, function(data) {
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
				})
			});
		}
		callback();
	},

	install: function() {
		log('install');
		api.makeInstall(function() {
			App.bind_and_do_if_settings_ok(App.mandatory_settings, function() {
				App.run();
			});
			api.makeSettings(App.mandatory_settings);
		});
	},

	bind_and_do_if_settings_ok: function(need_settings, callback) {
		api.addCallback('onSettingsChanged', function(current_settings) {
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
		api.call( 'photos.getAlbums' , {}, function(data) {
			if (data.response) {
				log('Try to recognize an album');
				for(var t in data.response) {
					if (data.response[t]['title'] == Upload.album_title) {
						Upload.album_id = data.response[t]['aid'];
						break;
					}
				}
				if (!Upload.album_id) {
					log('Cant find an album, try to create album');
					api.call( 'photos.createAlbum', {'title': Upload.album_title}, function(data) {
						log('Album created');
						Upload.album_id = data.response['aid'];
						after_find_album();
					});
				}
				else {
					log('Album finded');
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
			case 'wall': method = 'wall.getPhotoUploadServer'; params = {}; break;
			case 'photo': method = 'photos.getUploadServer'; params = {'aid': Upload.album_id}; break;
		}
		api.call(method, params, function(data) {
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
				method = 'wall.savePost';
				params = Upload.upload_result;
				params.message = Upload.message;
				params.wall_id = Upload.wall_id;
				break;
			case 'photo':
				method = 'photos.save';
				params = Upload.upload_result;
				break;
		}

		api.call( method, params, function(data) {
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
		api.addCallback('onWallPostSave', function() {
			log('Post wall success, do callback');
			after_post_wall();
		});
		api.addCallback('onWallPostCancel', function() {
			log('Post wall cancel');
		});
		api.external.saveWallPost(Upload.post_hash);
	}
};

Tools = {
	timer: new Date().getTime(),
	check_settings: function(current_settings, need_settings) {
		return (current_settings & need_settings) == need_settings;
	},
	log: function (msg) {
		elapsed = (new Date().getTime() - Tools.timer);
		date = new Date(elapsed);
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
api = App.api;