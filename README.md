# sfVkontaktePlugin plugin for symfony 1.3 and 1.4

This plugin is still in development. 

##Requirements:

*   Symfony 1.3 and more
*   Doctrine 1.2
*   php-curl module to make VK Api POST requests
*   jQuery 1.4.2 (maybe older version, not tested)

##Installation:

1.  Fetch code , move downloaded source to your plugin directory and enable plugin in SF_ROOT/config/ProjectConfiguration.class.php:

		$ cp ~/sfVkontaktePlugin SF_ROOT/plugins

		// SF_ROOT/config/ProjectConfiguration.class.php
		$this->enablePlugins('sfVkontaktePlugin');

2.  Enable the sfVkontakteFetch module to fetch friends and upload photos to VK server. Add this line to your SF_ROOT/frontend/config/settings.yml file:

		enabled_modules: [default, sfVkontakteFetch]

3.  Change routing options in factories.yml to automatically add mandatory iframe parameters to every link on your site. Change parameter in your SF_ROOT/frontend/config/factories.yml. Or you can set the enable_append_get_params configuration to false. See Configuration chapter.

		all:
		  routing:
		    class: sfVkontaktePatternRouting

4.  Change security settings of your application in SF_ROOT/frontend/config/security.yml

		default:
		  is_secure: true

5.  Download jQuery library and add link to it into view.yml of your application (or use another way to enable jQuery)

		javascripts:    [lib/jquery-1.4.2, main]

6.  Change inheritance of the myUser class in SF_ROOT/frontend/lib/myUser.class.php

		class myUser extends sfVkontakteUser {

7.  Change inheritance of your actions.class.php .
		class mainActions extends sfVkontakteActions {

8.  Add initialization component to application layout.php. Add it inside the &lt;body&gt; tag.

		<? include_component('sfVkontakteFetch', 'init')?>

9.  Put your VK App settings in settings.yml. Optionally add SF_ROOT/config/settings.yml to your VCS ignore. It allows you to have two instances of your VK App with different settings

		$ cp SF_ROOT/plugins/sfVkontaktePlugin/config/settings-example.yml SF_ROOT/config/settings.yml
		$ vi SF_ROOT/config/settings.yml

10.  Setup the database and model. Add to your user model actAs **sfVkontakteApiUser** behaviour.

		// doctrine/schema.yml
		User:
		  actAs: [sfVkontakteApiUser]

11.  Build and load your schema, or import sql manually. Then publish plugin assets.

		$ ./symfony doctrine:build --all --and-load
		$./symfony plugin:publish:assets

That's all, folks!

## Configuration:

As stated before, you must copy config/settings-example.yml to your config directory and change application_id and secret_key values.

Other configuration is in the app.yml file:

    	enable:
	      fetch: true
	      register_routes: true
	      add_js: true
	      append_get_params: true

	    user_model: User
	    photo_getter_class: vkPhotoGetter

1.	enable_fetch - do or not save user profile, user friends and profiles of user friends to the database.
2.	enable_register_routes - do or not automatically add fetch and upload photo routes to the routing collection. If it is setted to false, you should write these routing rules in your routing.yml file.
3.	enable_add_js - do or not add javascript files to the response. If it is setted to false, you should add required JS to your view.yml file or to js compressor paths. The required js are "http://vkontakte.ru/js/api/xd_connection.js?2" and "/sfVkontaktePlugin/js/common.js".
4.	enable_append_get_params - do or not append to every uri of every link on your site the get params, which passed from iframe. If it is setted to false, you must manage security of your app by yourself.
5.	user_model - the name of the user model, obviously. Default value is **User**.
6.	photo_getter_class - class used for retrieve path to the file needed to upload to vk server 

Condition of fetching friends and profiles is defined in sfVkontakteUser, in the getNeedFetch method, so you can write own method in your myUser class to redefine this behaviour. 

## Documentation:

### Server side, sfVkontakteTools class

sfVkontaktePlugin provides you sfVkontakteTools class, that allows you to call secure VK Api function.
In PLUGIN/config/app.yml you can see all secure methods provided by VK with theirs parameters. In any part of your project you can write:

		$this->getUser()->getBalance( array('uid' => $this->getUser()->id) );

or
		sfVkontakteTools::getInstance()->getBalance( array('uid' => $this->getUser()->id) );

, where getBalance is the name of the method, and it calls with array of proper parameters.

If you need to call for example the *sendNotification* method, you would like to pass utf8 string (in russian) in the *message* parameter. Plugin will handle it and automaticaly make proper signature to the call.

Another example:
		// in some action
		$this->getUser()->sendNotification(array('uids'=> $this->getUser()->id, 'message'=> 'it works!'));

### Links, routing, and security

I let VKontakte to check authority of user. Vkontakte make it by checking GET parameters passed to the iframe. It means that we should pass to every link on our site these parameters. I choose the routing way to do it.
Generally, it means that you should write every link code on the site by link_to or url_for functions. Also, all your applications that accessible from VK Iframe must be secured.

### User

In any place in your code you have:

the model User
		$this->user // in actions, instance of model User class
		$user 		// the same one in templates

and vkontakte security user
		$this->getUser() // in actions, instance of sfVkontakteUser
		$sf_user 		 // in templates

Model User has a number of fields. First, it has all the fields defined in plugin app.yml. Also it has **settings** field - api settings that user set. Finally, it has a fetched_at field - date and time when users settings were saved.

Use Doctrine Collection $this->user->Friends - to get friends list of current user.

These fields automatically updating every 24 hours (it can be changed by redefine getNeedFetch of your myUser class).

### Client side, vkApp classe

Usual way to use these classes is to write to your main.js code like this:

	$(function() {
		app = new vkApp(callback);
	});

The first parameter of constructor is the function, that will be called after all initialization. For example, you can write this code in that function. Lets have this html code, whatever:

	<div id='content'></div>
	<a id='post-photo' href='javascript:void(0);'>post_photo</a><br/>
	<a id='post-wall' href='javascript:void(0);'>post wall</a>

Then the code will be:

	var callback =  function (){
		// test use of the api object, retrieve name and surname
		$('#content').append(app.User.first_name + ' ' + app.User.last_name);

		// add onclick event - send photo to album
		$('#post-photo').click(function() {
			app.upload_photo(function(){},
			{
				album_title: 'new album'
			//	album_id: ##album id to post##
			})
		});

		// add onclick event - send photo and message to the walls
		$('#post-wall').click(function() {
			app.post_walls(function(){},
			{
				message: 'test',
				uids: [## wall ids for post##]
			});
		});
	}
The second parameter of constructor is options. Default options are:

		mandatory_settings: Settings.FRIENDS | Settings.NOTIFY | Settings.PHOTOS,
		unnessesary_settings: Settings.MENU,
		install_element: 				'#sf_vkontakte_install',
		mandatory_settings_element: 	'#sf_vkontakte_settings',
		unnessesary_settings_element: 	'#sf_vkontakte_unnessesary_settings',
		after_fetch_friends_done: function() {},
		after_fetch_friends_not: function() {}

You can override them by passing options hash to the constructor.

### Upload files to server - post to wall and upload photo to album

The app class has methods **upload_photo** and **post_walls**. They gets two parameters - callback and options. The options hash can content these items:
 - for app.upload_photo method: album_title or album_id
 - for app.post_walls method: message and uids

On the server you should define class, then write name of this class to your app.yml. This class must have static method **get**, which returns a path to the file need to upload with @ in the begining. See example tools/sfVkontaktePhotoGetter.class.php. This method should get one parameter - it passes from client - **server_method_params**.

You can override name of the method and list of parameters by setting in options hash:
		server_method: 'getWallImage',
		server_method_params: {id: app.User.uid}

## Todo:

1.	Rewrite getPhoto and all around it.
2.	Move FriendReference model to the actAs behaviour.


