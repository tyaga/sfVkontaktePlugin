/**
 * Vkontakte JavaScript API wrapper.
 *
 * This script meant for simplify development of Vkontakte applications
 * using Vkontakte API. Using vk_api() object you can call API methods,
 * get HTTP-GET parameters (aka flashVars) in a simple way. You don't need
 * to calculate signature parameter, don't need to form request string,
 * don't need to implement JSONP-communication. You just connect this script
 * to HTML-page using <script> tag, call one function to initialize object
 * and one function to perform API-request!
 *
 *
 * Changelog
 * 1.5.4
 * (+) Added field SETT_STATUS to use it in showSettingsBox() function.
 *
 * 1.5.3
 * (f) Fixed bug with blending data when call API-methods multiple times.
 * (f) Fixed removeCallback() bug.
 *
 * 1.5.2
 *			 == Special thanks to <Дмитрий Разумовский> ==
 * (f) Fixed bug with getting cookies in IE 6 and 7.
 *
 * 1.5.1
 * (+) Now GET-parameters of application properly transmitted from the first
 *	 page of application to all other pages you can open. So you needn't
 *	 to store all values manually and you can just use hyperlinks.
 * (i) Some changes in code to make it more readable and strong (thanks to
 *	 <Иванн Елизарьев> and his vk_api.js based library).
 *
 * 1.4.4
 * (f) Fixed IE bug with installation page.
 *
 * 1.4.3
 * (i) Now md5.js called from vk.com so it will work even if domain
 *	 vkontakte.ru denied by your admin.
 *
 * 1.4.2
 *			   == Special thanks to <Андреенко Артём> ==
 * (f) Fixed decodeSecret() bug in some browsers.
 *
 * 1.4.1
 *				== Special thanks to <Timofey Koolin> ==
 * (f) Fixed bug when first API request used and XML data requested. Now
 *	 if data came in XML in params.api_result, vk_api leaves it unparsed.
 *
 * 1.4
 *			 == Special thanks to <Лёшка JIEXA Арсеньев> ==
 * (+) Methods .makeInstall() and .makeSettings() returns after being
 *	 completely rewritten. Now these methods don't block entire page but
 *	 only prevent application to be used showing correct vkontakte-style
 *	 message.
 * (i) Now md5 function loaded from vkontakte.ru site, so library became
 *	 smaller.
 * (i) Multiple little bugs fixed and some little optimisations applied.
 *
 * 1.3
 * (-) Removed method .makeInstall().
 * (-) Removed method .makeSettings().
 * (i) Now if there is first API call, then it parsed in params.api_result
 *	 and you can deal with object ready to use. Of course JSON should be
 *	 use in first requert.
 * (i) Callbacks queue optimised.
 *
 * 1.2.1
 * (f) Fixed bug which caused errors like 'VK is not defined'.
 *
 * 1.2
 * (f) Methods .makeInstall() and .makeSettings() can now correctly work
 *	 one after another.
 * (i) Now all event handlers are organised in queue so you can set multiple
 *	 handlers to one event.
 * (i) Method .addCallback() now returns handler ID.
 * (i) Method .removeCallback() now gets event handler ID as the second
 *	 parameter.
 *
 * 1.1
 * (+) Method .makeInstall() to force user to install application added.
 * (+) Method .makeSettings() to force user to set appropriate settings
 *	 added.
 * (+) Set of constants .SETT_* added to simplify settings requesting.
 *
 * 1.0
 * (i) Release
 *
 *
 * @author Alexander Zubakov <zubakov@xinit.ru>
 * @copyright © 2010 Alexander Zubakov
 * @version 1.5.1
 * @license http://www.gnu.org/licenses/lgpl.html GNU Lesser General Public License
 */

/**
 * Create new object to call Vkontakte API throurh it.
 *
 * @param String api_secret Application sercet (can be changed on
 *						  application edit page).
 * @param Function oninit Function to perform after API initialised.
 * @param Function onfailure Function to perform if API initialisation
 *						   fails for msome reason.
 * @param boolean test_mode If set to true then all API requests will be
 *						  executed in test mode - additional parameter
 *						  test_mode=1 will be automatically added to every
 *						  API request, so you needn't do it manually.
 */
function vk_api(api_secret, oninit /* [, onfailure] [, test_mode] */) {

	/****************** Private Constants and variables *******************/
	/**
	 * URL of external JavaScript-file we need to call first of all.
	 * @var String
	 */
	var vk_api_initializer = 'http://vk.com/js/xd_connection.js';

	/**
	 * URl of vkontakte.ru MD5 function.
	 * @var String
	 */
	var vk_api_md5 = 'http://vk.com/js/lib/md5.js';

	/**
	 * Cookie prefix to make them unique.
	 * @var String
	 */
	var ckpref = '__vkjsapi_';

	/**
	 * List of all accessible GET-parameters names.
	 * var Array
	 */
	var params_list = [
		'api_url',   'api_id',	  'user_id',	  'group_id',
		'viewer_id', 'is_app_user', 'viewer_type',  'auth_key', 'referrer',
		'language',  'api_result',  'api_settings', 'parent_language', 'lc_name'
	]

	/**
	 * Message to make user install application.
	 * @var String
	 */
	var msg_install = 'Для работы приложения его необходимо <a href="#" id="vk_api_msga">установить</a>';

	/**
	 * Message to meke user set settings to application.
	 * @var String
	 */
	var msg_settings = 'Для работы приложения необходимо установить требуемые <a href="#" id="vk_api_msga">настройки</a>';

	/**
	 * This callback function is the third parameter of vk_api and executes
	 * if VK initialisation fails.
	 * @var Function
	 */
	var onfailure = null;

	/**
	 * Version of vkontakte API
	 * @var String
	 */
	var api_version = '2.0';

	/**
	 * Test mode flag. If true then test_mode enabled
	 * @var Boolean
	 */
	var test_mode = false;

	/**
	 * Queue of callback functions used by addCallback() to perform correct
	 * processing of multiple events assigned in different places
	 * @var Object
	 */
	var callbacks = {};

	/**
	 * Number of JSONP-callback function
	 * @var Number
	 */
	var cb_index = 0;

	/**
	 * Hack to use 'this' reference in callback functions in private methods
	 * @var Object
	 */
	var this_proxy = this;
	/***************** /Private Constants and variables *******************/


	/************************** Public Constants **************************/
	/**
	 * There is set of settings constants to modify application permissions
	 * using makeSettings() or external.showSettingsBox() methods.
	 * @const Number
	 */
	this.SETT_NOTIFY = 1; //allow to send notifications
	this.SETT_FRIENDS = 2; //add access to friends
	this.SETT_PHOTOS = 4; //add access to photos
	this.SETT_AUDIO = 8; //add access to audio
	this.SETT_OFFER = 32; //add access to offers
	this.SETT_QUESTIONS = 64; //add access to questions
	this.SETT_WIKI = 128; //add access to Wiki-pages
	this.SETT_MENU = 256; //add access to left menu
	this.SETT_WALL = 512; //add access to user wall
	this.SETT_STATUS = 1024; //add access to user status
	/************************* /Public Constants **************************/


	/************************* Public Properties **************************/
	/**
	 * Parameters, which were sent to application through request string
	 * @var Object
	 */
	this.params = {};
	/************************ /Public Properties **************************/


	/****************************** Methods *******************************/
	/**** Private: ****/

	/**
	 * Sort key-value pairs in objects by alphaber in ascending order.
	 *
	 * @param Object obj Object which keys to sort.
	 * @return Object Object with the same set key-value pairs as 'obj' but
	 *				sorted in ascending order.
	 */
	function sortByKey(obj) {

		//make Array from object keys
		var keys = new Array();
		for (var k in obj) {
			keys.push(k);
		}

		//sort Array
		keys.sort();

		//form new object with keys sorted alphabetically
		var sortedObj = {};
		for (var i = 0; i < keys.length; i++) {
			sortedObj[keys[i]] = obj[keys[i]];
		}

		return sortedObj;
	}

	/**
	 * Perform XSS-request (load JavaScript).
	 *
	 * @param String url URL of JavaScript file to load and execute in
	 *				   context of this page.
	 */
	function requestScript(url) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		document.getElementsByTagName('head')[0].appendChild(script);
	}

	/**
	 * Decode api_secret if it is encoded using special algorithm accessible
	 * at http://xinit.ru/vk_app_secret/
	 *
	 * @param String api_secret Application secret from application edit
	 *						  page. If it is encoded then function
	 *						  performs decoding. If secret is not encoded
	 *						  then function returns api_secret itself.
	 * @return String Decoded application secret.
	 */
	function decodeSecret(api_secret) {

		//decode api_secret
		if (api_secret.substring(0, 4) == 'sx--') {

			var api_secret_decoded = '';
			var char_code = '';

			for (var i = 4; i < api_secret.length; i++) {

				//form char code
				if (api_secret.charAt(i) != 'l') {
					char_code += api_secret.charAt(i);

					//there is full char_code
				} else {
					api_secret_decoded += String.fromCharCode(parseInt(char_code) + 31);
					char_code = '';
				}
			}

			return api_secret_decoded;

			//api_secret is not encoded, so just return it
		} else {
			return api_secret;
		}
	}

	/**
	 * Makes object to react on events.
	 *
	 * @param string Type of event to handle
	 * @param Function Function to call when event occurs.
	 * @param boolean Flag shows if we need to capture event.
	 * @return boolean true, if event is successfully set, false otherwise.
	 */
	function addEvent(obj, eventType, callback /* [, useCapture] */) {

		//set default value
		useCapture = false;
		if (arguments.length > 2) {
			useCapture = arguments[2];
		}

		//try to use DOM possibility
		if (typeof obj.addEventListener != 'undefined') {
			obj.addEventListener(eventType, callback, useCapture);
			return true;

			//use IE capability
		} else if (typeof obj.attachEvent != 'undefined') {
			return obj.attachEvent('on' + eventType, callback);
		}
	}

	/**
	 * Get cookie variable.
	 *
	 * @param string name Name of cookie variable to get.
	 * @return string Value of the variable we got.
	 */
	function getcookie(name) {
		if (document.cookie.length > 0) {
			c_start = document.cookie.indexOf(name + '=');

			if (c_start != -1) {
				c_start = c_start + name.length + 1;
				c_end = document.cookie.indexOf(";", c_start);

				if (c_end == -1) {
					c_end = document.cookie.length;
				}

				return unescape(document.cookie.substring(c_start, c_end));
			}
		}

		//no variable with given name found
		return undefined;
	}

	/**
	 * Set cookie with given name and value.
	 *
	 * @param String name Name of cookie variable.
	 * @param String value Value of variable.
	 */
	function setcookie(name, value) {

		//set cookie
		document.cookie = name + '=' + escape(value);
	}

	/**
	 * Load parameters from document URL or from cookies if there is no
	 * GET-parameters.
	 *
	 * @param String url URL of the page to load API parameters from.
	 */
	function loadParams(url) {
		VK.loadParams(document.location.href);

		//there are GET-parameters
		if (typeof VK.params.api_id != 'undefined') {

			//get parameters
			this_proxy.params = VK.params;

			//add all parameters to cookies
			for (var p in params_list) {
				if (typeof this_proxy.params[params_list[p]] != 'undefined') {
					setcookie(ckpref + params_list[p], this_proxy.params[params_list[p]]);
				}
			}

			//there are no GET-parameters, so try to get them from cookies
		} else {
			this_proxy.params = {};

			//load all parameters from cookies
			for (var p in params_list) {

				//load parameter from cookies
				this_proxy.params[params_list[p]] = getcookie(ckpref + params_list[p]);

				//if there is no such parameter then remove it from parameters
				if (typeof this_proxy.params[params_list[p]] == 'undefined') {
					delete this_proxy.params[params_list[p]];
				}
			}
		}
	}

	/**
	 * Show message which don't allow user to use application. Used if user
	 * hasn't installed application or set wrong settins.
	 *
	 * @param String msg Message text to show.
	 * @param Number settings Settings value application need user to set.
	 */
	function showMessage(msg /* , settings */) {

		//define settings if this is 'wrong settings' message
		var settings = -1;
		if (arguments.length > 1) {
			settings = arguments[1];
		}

		//show message
		if (document.getElementById('vk_api_msgbox') == null) {

			//create new message box
			document.getElementsByTagName('body')[0].innerHTML +=
					'<div id="vk_api_msgbox" style="' +
							'position: absolute;' +
							'width: 100%; height: 100%;' +
							'margin: 0; padding: 50px 0 0 0;' +
							'border-top: #dbe2e8 1px solid;' +
							'top: 0; left: 0;' +
							'z-index: 100;' +
							'background: white; color: gray;' +
							'font-size:12px;' +
							'text-align:center;' +
							'">' +
							msg +
							'</div>';
		} else {

			//just change text in existing message box
			//document.getElementById('vk_api_msgbox').innerHTML = msg;
			document.getElementById('vk_api_msgbox').style.display = 'block';
		}

		//create onclick handler
		addEvent(
				document.getElementById('vk_api_msga'),
				'click',
				function() {

					//this is 'wrong settings' message
					if (settings >= 0) {
						this_proxy.external.showSettingsBox(settings);

						//this is 'not installed' message
					} else {
						this_proxy.external.showInstallBox();
					}
				},
				true
				);
	}

	/**
	 * Hide message previously shown with showMessage().
	 */
	function hideMessage() {
		if (document.getElementById('vk_api_msgbox') != null) {
			document.getElementById('vk_api_msgbox').style.display = 'none';
		}
	}


	/**** Public: ****/
	/**
	 * Ask user to install application (add to their page) in indefinite
	 * loop until user finally installs application.
	 * Warning!  Application will ask user to install application until he
	 * did it, so if user don't want to add application to his page, he
	 * can't run application.
	 *
	 * @param Function ifInstalled Callback function which executed if and
	 *							 only if application is installed. First
	 *							 time function executes if user installs
	 *							 application after makeInstall() called.
	 *							 But unlike
	 *							 addCallback('onApplicationAdded', ...),
	 *							 this function executes even if
	 *							 application already added before
	 *							 makeInstall() called. This means that if
	 *							 you use makeInstall(fucnName) then
	 *							 funcName() will be executed every time
	 *							 user runs application, even if he
	 *							 installed application only once long time
	 *							 ago.
	 */
	this.makeInstall = function(/* ifInstalled */) {

		//define if there is ifInstalled callback
		var appInstalled = null;
		if (arguments.length > 0) {
			appInstalled = arguments[0];
		}

		//current application settings and settings we need are different so
		//show installation window
		if (this_proxy.params.is_app_user != 1) {

			//hide entire application with special message
			showMessage(msg_install);

			this_proxy.external.showInstallBox();

			//when user adds application
			this_proxy.addCallback(
					'onApplicationAdded',
					function() {

						//set new settings as current and verify if settings are
						//correct again
						this_proxy.params.is_app_user = 1;
						hideMessage();

						//application added so run appInstalled
						if (appInstalled != null) appInstalled();
					}
					);

			//application is already installed, so just run callback
		} else {
			if (appInstalled != null) appInstalled();
		}

	}

	/**
	 * Ask user to set appropriate settings and wait for user to do it.
	 * Warning! Application will ask user to specify settings until he did
	 * it, so if user don't want to set your settings, he can't run
	 * application.
	 *
	 * @param Number settings Settings you want user to set to application.
	 *						You can use either integer value according to
	 *						official Vkontakte documentation on
	 *						http://vkontakte.ru/page7002134 or combination
	 *						of .SETT_* constants.
	 */
	this.makeSettings = function(settings) {

		//current application settings and settings we need are different so
		//show settings-change window
		if ((this_proxy.params.api_settings & settings) != settings) {

			//hide entire application with special message
			showMessage(msg_settings, settings);

			this_proxy.external.showSettingsBox(settings);
		}

		//when settings changed
		this_proxy.addCallback(
				'onSettingsChanged',
				function(new_settings) {

					//set new settings as current and verify if settings are
					//correct again
					this_proxy.params.api_settings = new_settings;

					//current application settings and settings we need are the
					//same so hide message window
					if ((this_proxy.params.api_settings & settings) == settings) {
						hideMessage();
					}
				}
				);
	}

	/**
	 * Call Vkontakte API method.
	 *
	 * @param String method Method name to execute.
	 * @param Object parameters Parameters of API method in the following
	 *						  form:
	 *						  {
	 *							  name1: 'value 1',
	 *							  name2: 'value 2',
	 *
	 *							  //arrays are also allowed
	 *							  name3: [
	 *								  'array_value_1',
	 *								  'array_value_2',
	 *								  'array_value_3'
	 *							  ]
	 *						  }
	 * @param Function onData Callback function to perform when answer from
	 *						API call comes from server. Function has the
	 *						only parameter - object with method call
	 *						results.
	 */
	this.call = function(method /* [, parameters] [, onData] */) {

		//onData callback
		var onData = null;

		//onData is the second parameter
		if ((arguments.length >= 2) && (typeof arguments[1] == 'function')) {
			onData = arguments[1];

			//onData is the third parameter
		} else if ((arguments.length >= 3) && (typeof arguments[2] == 'function')) {
			onData = arguments[2];
		}

		//callback name
		var cb_name = ckpref + 'cbfunk_' + (++cb_index);

		/**
		 * Performs when browser gets server response to parse response and
		 * call onData function. Located in widdow scope to be accessible
		 * for loaded script.
		 *
		 * @param Object json JSON object which browser got from server,
		 *					already evaluated and ready for using.
		 */
		window[cb_name] = function(json) {

			//call onData callback function
			if (onData != null) {
				onData(json);
			}
		};


		//parameters to send to server
		var parameters = {};
		if ((arguments.length >= 2) && (typeof arguments[1] == 'object')) {
			parameters = arguments[1];
		}

		//append parameters with common strings
		parameters.api_id = this_proxy.params.api_id;
		parameters.v = api_version;
		parameters.format = 'json';
		parameters.callback = cb_name;

		//set test mode
		if (test_mode) parameters.test_mode = '1';

		//append parameters with method name
		parameters.method = method;

		//sort parameters
		parameters = sortByKey(parameters);


		//calculate API signature and add it to parameters list
		var sig = this_proxy.params.viewer_id;
		for (var k in parameters) {

			//can be array
			if (typeof parameters[k] == 'object') {
				sig += k + '=' + parameters[k].join(',');

				//ordinar parameter
			} else {
				sig += k + '=' + parameters[k];
			}
		}
		sig += decodeSecret(api_secret);
		parameters.sig = MD5(sig);

		//form URL to call
		var url = this_proxy.params.api_url + '?';
		for (var k in parameters) {
			url += k + '=' + encodeURIComponent(parameters[k]) + '&';
		}


		//load and execute script
		requestScript(url);
	}
	/***************************** /Methods *******************************/


	/************************ Initialize object ***************************/
	//onfailure() function is set as the third parameter of vk_api()
	if ((arguments.length >= 3) && (typeof arguments[2] == 'function')) {
		onfailure = arguments[2];
	}

	//test_mode is set as the third parameter of vk_api()
	if ((arguments.length >= 3) && (typeof arguments[2] == 'boolean')) {
		test_mode = arguments[2];

		//test_mode is set as the fourth parameter of vk_api()
	} else if ((arguments.length >= 4) && (typeof arguments[3] == 'boolean')) {
		test_mode = arguments[3];
	}

	//request MD5 function from vkontakte
	requestScript(vk_api_md5);

	//first of all we need to load special library from vk.com
	requestScript(vk_api_initializer);

	//wait to 'vk_api_initializer' to load
	var VKLOAD_intervel = setInterval(
			vkapiInit,
			100
			);

	/**
	 * Perform when 'vk_api_initializer' loaded.
	 */
	function vkapiInit() {
		if ((typeof VK != 'undefined') && (typeof MD5 != 'undefined')) {
			clearInterval(VKLOAD_intervel);

			//initialize VK object
			VK.init(
				/**
				 * Perform on successful init.
				 */
					function() {
						//get VK.params and translate it to vk_api.params
						//VK.loadParams(document.location.href);
						//this_proxy.params = VK.params;
						loadParams(document.location.href);

						//parse json response from the first api call result if
						//it is not in XML
						if (
								(typeof this_proxy.params.api_result != 'undefined') &&
										(this_proxy.params.api_result.indexOf('<?xml') != 0)
								) {
							this_proxy.params.api_result = eval('(' + this_proxy.params.api_result + ')');
						}

						//map VK.External methods to vk_api.external
						this_proxy.external = VK.External;

						/**
						 * Call external method.
						 *
						 * @param String method Method name to call. You can
						 *					  call methods from external.*
						 *					  (VK.External.*) with proper
						 *					  parameters.
						 */
						this_proxy.callMethod = function(method /*, ...*/) {
							VK.callMethod.apply(VK, arguments);
						}

						/**
						 * Add callback function.
						 *
						 * @param String name Name of event to which callback
						 *					will be added.
						 * @param Function callback Callback function to run
						 *						  after event 'name' occurs.
						 * @return Number ID of assigned callback function.
						 */
						this_proxy.addCallback = function(name, callback) {

							//add callback to the queue
							if (typeof callbacks[name] == 'undefined') {
								callbacks[name] = new Array();
							}
							callbacks[name].push(callback);

							//add callback using VK
							VK.addCallback(
									name,

								/**
								 * Function uses callbacks queue to call all
								 * functions that were added using addCallback()
								 * in order it were added.
								 */
									function() {

										//call every callback in the queue
										for (var c in callbacks[name]) {

											//call callback if it is not deleted
											if (callbacks[name][c] != null) {
												callbacks[name][c].apply(null, arguments);
											}
										}
									}
									);

							//return so called ID of assigned callback function
							//to use it in removeCallback() function
							return callbacks[name].length - 1;
						};

						/**
						 * Remove callback function from the queue.
						 *
						 * @param String name Name of event from which callback
						 *					will be removed.
						 * @param Number callback_id ID of callback function to
						 *						   remove from queue.
						 */
						this_proxy.removeCallback = function(name, callback_id) {
							//do not remove callback using low-level function
							//VK.removeCallback(name, callback);

							//remove function from the queue
							//really just replace it with empty function
							callbacks[name].splice(callback_id, 1, null);
						};

						//execute user initialisation function
						oninit();
					},

				/**
				 * Perform on init failure.
				 */
					function() {
						if (onfailure != null) {
							onfailure();
						}
					}
					);
		}
	}

	/*********************** /Initialize object ***************************/
}
