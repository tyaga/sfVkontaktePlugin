/**
 * vkApp
 *
 * @package	sfVkontaktePlugin
 * @subpackage	js lib
 * @author	 Alexey Tyagunov <atyaga@gmail.com>
 */
/**
 * Settings constants holder
 */
Settings = {
	NOTIFY	  :    1, // allow to send notifications
	FRIENDS   :    2, // add access to friends
	PHOTOS    :    4, // add access to photos
	AUDIO     :    8, // add access to audio
	OFFER     :   32, // add access to offers
	QUESTIONS :   64, // add access to questions
	WIKI      :  128, // add access to wiki-pages
	MENU      :  256, // add access to left menu
	WALL      :  512, // add access to user wall
	STATUS    : 1024, // add access to user status

	check: function(current, needed) {
		return (current & needed) == needed;
	}
};
/**
 * 
 * @param callback
 * @param options
 */
function vkApp(callback /*, options*/) {
	this.User = null;

	function extend_global(_options, options) {
		// vkontakte_options is global variable setted in _init_js_options.php component.
		return $.extend(vkontakte_options, _options, options);
	}

	var options = extend_global({
		mandatory_settings: Settings.FRIENDS | Settings.NOTIFY | Settings.PHOTOS,
		unnecessary_settings: Settings.MENU,
		install_element: 				'#sf_vkontakte_install',
		mandatory_settings_element: 	'#sf_vkontakte_settings',
		unnecessary_settings_element: 	'#sf_vkontakte_unnecessary_settings',
		after_fetch_friends_done: function() {},
		after_fetch_friends_not: function() {}
	},(arguments.length = 2)?arguments[1]:{})

	var this_proxy = this;
	/**
	 * Calls check settings and fetch profiles methods,
	 * after all - call passed after_create callback
	 */
	function run() {
		log('run');
		check_settings(function() {
			fetch_profile(function() {
				log('Preload has done, do run App');
				callback();
			});
		});
	};
	/**
	 * It checks settings, if it is OK - calls callback
	 *
	 * @param callback
	 */
	function check_settings(callback){
		log('check settings');
		VK.api('getUserSettings', {}, function(data){if (!(typeof data.response == 'undefined')){
			log('Settings fetched, check them');
			VK.params.api_settings = data.response;
			// just show element, do not stop running
			if (!Settings.check(VK.params.api_settings, options.unnecessary_settings)) {
				log("Wrong unnecessary settings, show link");
				$(options.unnecessary_settings_element).click(function() {
					VK.callMethod('showSettingsBox',options.unnecessary_settings);
				}).show();
				bind_and_do_if_settings_ok(options.unnecessary_settings, function() {
					$(options.unnecessary_settings_element).hide();
				});
			}
			// show element and bind callback to changed settings
			if (Settings.check(VK.params.api_settings, options.mandatory_settings)) {
				log('Mandatory settings are OK, go forward');
				callback();
			}
			else {
				log("Wrong mandatory settings, can't run");
				bind_and_do_if_settings_ok(options.mandatory_settings, function() {
					hide_message(options.mandatory_settings_element);
					callback();
				});
				show_message(options.mandatory_settings_element, function(){ VK.callMethod("showSettingsBox", options.mandatory_settings); });
				VK.callMethod("showSettingsBox", options.mandatory_settings);
			}
		}});

	};
	/**
	 * Bind onSettingsChanged callback and run callback if settings are OK
	 * @param need_settings
	 * @param callback
	 */
	function bind_and_do_if_settings_ok(need_settings, callback) {
		var callback_id = this_proxy.addCallback('onSettingsChanged', function(current_settings) {
			VK.params.api_settings = current_settings;
			if (Settings.check(current_settings, need_settings)) {
				log('Changed settings are OK, run callback :' + need_settings );
				this_proxy.removeCallback('onSettingsChanged', callback_id);
				callback();
			}
		});
	};
	/**
	 * Ask user to set required settings
	 * @param settings
	 */
	function make_settings(settings) {
		if (!Settings.check(VK.params.api_settings, settings)) {
			show_message(options.mandatory_settings_element, function(){ VK.callMethod("showSettingsBox", settings); });
			VK.callMethod("showSettingsBox", settings);
		}
		var callback_id = this_proxy.addCallback('onSettingsChanged',function(new_settings) {
			VK.params.api_settings = new_settings;
			if (Settings.check(VK.params.api_settings, settings)) {
				hide_message(options.mandatory_settings_element);
				this_proxy.removeCallback('onSettingsChanged', callback_id);
			}
		});
	};

	function show_message(id, onclick){ $(id).show().click(onclick); };
	function hide_message(id){ $(id).hide(); };
	/**
	 * Gets friends, friends profiles and user profile
	 * Assigns user profile to App.User
	 * Saves all data to server
	 *
	 * @param callback
	 */
	function fetch_profile(callback) {
		// if we need to fetch friends?
		if (options.need_fetch) {
			log('fetch profile and friends');
			var fields_param = '"fields": "' + options.profile_fields + '"';
			// Code in VKScript lang
			var code =
			'var friends = API.getFriends();' +
			'var friendsProfiles = API.getProfiles({"uids": friends, ' + fields_param + '});' +
			'var myProfile = API.getProfiles({"uids": ' + VK.params.viewer_id + ', ' + fields_param + '});' +
			'return {"friendsProfiles": friendsProfiles, "myProfile": myProfile };';

			VK.api('execute', {'code': code}, function(data) {
				data = data.response;
				this_proxy.User = data.myProfile[0];
				log("Friends and profiles fetched, tryng to send");

				data.settings = VK.params.api_settings;
				// save to server
				$.post(options.fetch_url, data, function(result) {
					if (result) {
						log("Profiles sent, call callback done");
						options.after_fetch_friends_done();
					}
					else {
						log("Profiles sent, but hasn't saved, call callback not need to save");
						options.after_fetch_friends_not();
					}
					callback();
				})
			});
		}
		// if we do not need to fetch
		else {
			log('fetch profile');
			// just retrieve current user profile
			VK.api('getProfiles', { uids: VK.params.viewer_id, fields: options.profile_fields}, function(data){
				this_proxy.User = data.response[0];
				callback();
			});
		}
	};
	/**
	 * Install application and ask user to make settings
	 */
	function install() {
		log('install');
		make_install(function() {
			bind_and_do_if_settings_ok(options.mandatory_settings, function() {
				run();
			});
			make_settings(options.mandatory_settings);
		});
	};
	/**
	 * Ask user to install Application
	 * @param callback
	 */
	function make_install(callback) {
		if (VK.params.is_app_user == 0) {
			show_message(options.install_element, function(){ VK.callMethod('showInstallBox'); });
			this_proxy.addCallback('onApplicationAdded', function() {
				VK.params.is_app_user = 1;
				hide_message(options.install_element);
				callback();
			});
			VK.callMethod('showInstallBox');
		}
		else {
			callback();
		}
	};
	/**
	 * work around queue of callbacks
	 */
	var queue = {};
	this.addCallback = function(name, callback) {
		if (typeof queue[name] == 'undefined') {
			queue[name] = new Array();
		}
		queue[name].push(callback);
		VK.addCallback(name, function() {
			for (var c in queue[name]) {
				if (queue[name][c] != null) {
					queue[name][c].apply(null, arguments);
				}
			}
		});
		return queue[name].length - 1;
	};
	this.removeCallback = function(name, callback_id) {
		queue[name].splice(callback_id, 1, null);
	};

	this.upload_photo = function(callback, options) {
		vkPhotoUploader(callback, extend_global({
			server_method: 'get',
			server_method_params: {}
		}, options));
	};
	this.post_walls = function(callback, options) {
		vkWallUploader(callback, extend_global({
			server_method: 'get',
			server_method_params: {}
		}, options));
	};
	this.resizeWindow = function() {
		window.setTimeout(function() {
			VK.callMethod('resizeWindow', $(document.body).outerWidth(true), $(document.body).outerHeight(true)); 
		}, 100);
	};
	/**
	 * Constructor
	 *
	 * All the running code should be inside the create callback
	 *
	 */
	log('Create application');
	/*try {*/
	VK.init(function() {

		// load url parameters into VK.params
		VK.loadParams(document.location.href);

		// run or install the app
		if (VK.params.is_app_user != 0) {
			run();
		}
		else {
			install();
		}
	});
	/*}
	catch(e) {
		if (e.name == 'TypeError') {
			log("Can't run app outside vkontakte iframe, redirect");
			//window.location.href = 'http://vkontakte.ru/app' + vkontakte_options.application_id;
		}
		else {
			log("An error occured: " + e);
		}
		console.log(e);
	}*/
};

function vkPhotoUploader(callback, options) {
	function find_album(callback) {
		if (typeof options.album_id == 'undefined' && typeof options.album_title != 'undefined') {
			VK.api( 'photos.getAlbums' , {}, function(data) {if (data.response) {
				log('Try to recognize an album');
				var album_id = false;
				for(var t in data.response) {
					if (data.response[t]['title'] == options.album_title) {
						album_id = data.response[t]['aid'];
						break;
					}
				}
				if (!album_id) {
					log('Cant find an album, try to create album');
					VK.api( 'photos.createAlbum', {'title': options.album_title}, function(data) {
						log('Album created');

						callback(data.response['aid']);
					});
				}
				else {
					log('Album finded ' + album_id);
					callback(album_id);
				}}
				else {
					log('Error while fetching albums');
				}
			});
		}
		else {
			callback(options.album_id);
		}
	};
	function upload(album_id, callback) { log('get_server');
		VK.api('photos.getUploadServer', {aid: album_id }, function(data) { if (data.response) {
			log("Server fetched");
			$.post(options.upload_photo_url,
			{	server: data.response.upload_url,
				method: options.server_method,
				params: options.server_method_params,
				mode: 'photo'
			},
			function(data) { if (data.response) {
				log('Photo has uploaded to vk, save');
				VK.api( 'photos.save', data.response, function(data) {if (data.response) {
					log('Photo saved, do callback');
					callback();
				}
				else {
					log('Cant save photo');
				}});
			}
			else {
				log('Error occured while uploading photo:' + data.error);
			}});
		}
		else {
			log("Error while fetching server");
		}});
	};

	find_album(function(album_id) {
		upload(album_id, function(){
			callback();
		});
	});
};
function vkWallUploader(callback, options) {
	function upload(id, callback) {
		VK.api('wall.getPhotoUploadServer', {wall_id: id}, function(data) {if (data.response) {
			$.post(options.upload_photo_url, {
				server: data.response.upload_url,
				method: options.server_method,
				params: options.server_method_params,
				mode: 'wall'
			}, function(data) { if (data.response){
				data.response.wall_id = id;
				data.response.message = options.message;
				callback.apply(null, [data.response]);
			}
			else{
				log('Error occured while uploading photo:' + data.error);
			}});
		}
		else {
			log('Error while fetching server');
		}});
	};
	function save(data, callback){
		VK.api( 'wall.savePost', data, function(data) {if (data.response){
			VK.addCallback('onWallPostSave', function() {
				setTimeout(function() { callback.call() }, 1000);
			});
			VK.addCallback('onWallPostCancel', function() {
				setTimeout(function(){ callback.call() }, 1000);
			});
			VK.callMethod('saveWallPost', data.response.post_hash);
		}else{
			log('Cant post wall');
		}});
	};

	var queue = [];
	for (var uid in options.uids) {
		queue.push([function(wall_id) {
			upload(wall_id, function(data){
				save(data, function() {
					call(queue);
				})
			});
		}, null, [options.uids[uid]]]);
	}
	call(queue);
	function call(q){
		if (q.length > 0) {
			var data = q.shift();
			data[0].apply(data[1], data[2]);
		}
		else {
			callback();
		}
	}
};
Tools = {
	timer: new Date().getTime(),
	log: function (msg) {
		var elapsed = (new Date().getTime() - Tools.timer);
		var date = new Date(elapsed);
		msg = '[' + date.getSeconds() + '.' + date.getMilliseconds() + '] ' +  msg ;
		if (typeof DEBUG == 'undefined') {
			DEBUG = false;
		}
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
