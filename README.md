# sfVkontaktePlugin plugin to symfony 1.4

Документация на русском языке - README-ru .md

**What does plugin do?**

It was made to strongly simplify the development of [VKontakte](http://vk.com/) [applications](http://vk.com/pages.php?act=developers) on [Symfony Framework](http://www.symfony-project.org/).

*VKontakte is [the most popular social network service](http://en.wikipedia.org/wiki/Vkontakte) in [CIS](http://en.wikipedia.org/wiki/Commonwealth_of_Independent_States). It has around 75 million users.*

Plugin gives you:

1.  Php class for performing secure VKontakte api calls;
2.  JS library-wrapper for the installation of the application, for making proper settings, uploading photos to VKontakte albums and posting messages on  walls;
3.  Profile and friends retriever, the tool to save profile of current user and list of his friends to your database.

This plugin is still in development, but the development concerns only the adjustment of plugin features.

[The test application for this plugin](http://vkontakte.ru/app1889525).

##Requirements:

*   [Symfony](http://www.symfony-project.org/) 1.3 and above. ORM must be Doctrine only.
*   [jQuery](http://jquery.com) 1.4.2 (maybe previous versions)
*   php-curl module to make VK Api POST requests

##Installation:

* Install the plugin

		./symfony plugin:install sfVkontaktePlugin

or

*  Use **git submodule** command to fetch code or just do **git clone** command into your plugin directory. Then enable plugin in SF_ROOT/config/ProjectConfiguration.class.php:

		// SF_ROOT/config/ProjectConfiguration.class.php
		$this->enablePlugins('sfVkontaktePlugin');

*  Enable the sfVkontakteFetch module to allow plugin to fetch profiles and upload photos to VK server. Add this line to your SF_ROOT/frontend/config/settings.yml file:

		enabled_modules: [default, sfVkontakteFetch]

*  Change routing options in factories.yml to automatically add mandatory iframe parameters to every link on your site. Change parameter in your SF_ROOT/frontend/config/factories.yml. If you don't want to add mentioned parameters, set the **enable_append_get_params** configuration to *false*. See the Configuration chapter.

		all:
		  routing:
		    class: sfVkontaktePatternRouting

*  Change security settings of your frontend application in SF_ROOT/frontend/config/security.yml

		default:
		  is_secure: true

*  Download jQuery library and add link to it in view.yml (or use another way to enable jQuery)

		javascripts:    [lib/jquery-1.4.2, main]

*  Change inheritance of the myUser class in SF_ROOT/frontend/lib/myUser.class.php

		class myUser extends sfVkontakteSecurityUser {

*  Change inheritance of your actions.class.php .

		class mainActions extends sfVkontakteActions {

*  Add js setter partial to application layout.php. Add it inside the &lt;head&gt; tag and before including all other javascripts.

		<?php include_partial('sfVkontakteFetch/init_js_options')?>

*  If you want to use default installation and settings messages, include the **_messages** partial to the application layout.php file. Include it inside the &lt;body&gt; tag. Otherwise, define ids of **div** tags that contain your messages in second parameter **options** of the vkApp constructor. See Client side chapter.

		<?php include_partial('sfVkontakteFetch/messages')?>

*  Copy settings-example.yml to your config directory. Put the settings of your application in settings.yml. You can copy these settings from "edit application" page on vk.com site. Optionally add SF_ROOT/config/settings.yml to your VCS ignore file. It allows you to have two instances of your application with different settings. For example, development and production instances.

		$ cp SF_ROOT/plugins/sfVkontaktePlugin/config/settings-example.yml SF_ROOT/config/settings.yml
		$ vi SF_ROOT/config/settings.yml

*  Build and load your schema, or import sql manually. Then publish plugin assets.

		$ ./symfony doctrine:build --all --and-load
		$./symfony plugin:publish-assets

That's all, folks!

## Configuration:

As stated before, you have to copy **config/settings-example.yml** file to your config directory and change the **application_id** and **secret_key** values.

Another configuration is in the app.yml file:

	    enable_fetch: true
	    enable_register_routes: true
	    enable_add_js: true
	    enable_append_get_params: true

	    photo_getter_class: vkPhotoGetter

1.	**enable_fetch** - to save or not user profile, user friends and profiles of user friends to the database;
2.	**enable_register_routes** - automatically add or not the *fetch* route and the *upload photo* route to the routing collection. If this option is set to false, you have to write these routing rules in your routing.yml file;
3.	**enable_add_js** - add or not javascript files to the response. If it is set to false, you have to add required javascripts to your **view.yml** file or to js compressor paths. The required javascripts are **"http://vkontakte.ru/js/api/xd_connection.js?2"** and **"/sfVkontaktePlugin/js/common.js"**;
4.	**enable_append_get_params** - append or not the GET params, which passed from iframe, to every uri on your site. If it is set to false, you have to manage security of your application by yourself;
5.	**photo_getter_class** - class used for retrieve path to the file needed to upload to VK server. See ** Upload files to server** chapter.

PluginsfVkontakteUser model class has the method **getNeedFetch**. This method returns the condition of fetch or not friends and profiles. So you can write your own method in generated **sfVkontakteUser** model class to redefine this behaviour.

## Documentation:

### Server side, sfVkontakteTools class

sfVkontaktePlugin provides you with sfVkontakteTools class, that allows you to call secure VK Api function.
In PLUGIN/config/app.yml you can see all secure methods provided by VK with theirs parameters. In any part of your project you can write:

		$this->getUser()->getBalance( array('uid' => $this->getUser()->id) );

or
		sfVkontakteTools::getInstance()->getBalance( array('uid' => $this->getUser()->id) );

, where getBalance is the name of the method, and it calls with array of proper parameters.

If you need to call for example the *sendNotification* method, you would like to pass utf8 string (in Russian) in the *message* parameter. Plugin will handle it and automatically make proper signature to the call.

Another example:
		// in some action
		$this->getUser()->sendNotification(array('uids'=> $this->getUser()->id, 'message'=> 'it works!'));

### Links, routing, and security

I let VKontakte to check authority of user. Vkontakte makes it by checking GET parameters passed to the iframe. It means that we should pass these parameters to every link on our site. I choose the routing way to do it.
Generally, it means that you should write every link code on the site by link_to or url_for functions. Another requirement is that all your accessible from VK Iframe applications must be secured (is_secure: true in security.yml).

### User

In any place in your code you have:

the model sfVkontakteUser
		$this->vkontakteUser // in actions, instance of model User class
		$vkontakteUser 		// the same one in templates

and vkontakte security user
		$this->getUser() // in actions, instance of sfVkontakteSecurityUser
		$sf_user 		 // in templates

Model sfVkontakteUser has a number of fields. First, it has all the fields defined in plugin app.yml. Also it has **settings** field - api settings that user set. Finally, it has a fetched_at field - date and time when users settings were saved.

Use Doctrine Collection $this->vkontakteUser->Friends - to get friends list of current user.

These fields are automatically updating every 24 hours (it can be changed by redefine getNeedFetch of your myUser class).

### Client side, vkApp class

If you want to watch loading and run processes in your console, define "DEBUG = true;" in your js file. 

Usual way to use these classes is to write to your main.js code like this:

	$(function() {
		app = new vkApp(callback);
	});

The first parameter of constructor is the function, that will be called after all initialization. For example, you can write this code in that function. Let's have this html code, whatever:

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
			//	album_id: ##album id to post to ##
			})
		});

		// add onclick event - send photo and message to the walls
		$('#post-wall').click(function() {
			app.post_walls(function(){},
			{
				message: 'test',
				uids: [## array of wall ids for post on ##]
			});
		});
	}

The second parameter of constructor is options. Default options are:

1. mandatory_settings. Default value is: *Settings.FRIENDS | Settings.NOTIFY | Settings.PHOTOS*. These settings value are necessary for application running.
Application asks these settings from user just after install and every page load. If they are not set, applicaion won't run.
2. unnecessary_settings: Default value is: *Settings.MENU*. If they are not set, the message will appear.
3. install_element, default value is: *'#sf_vkontakte_install'*,    
mandatory_settings_element, default value is: *'#sf_vkontakte_settings'*,    
unnecessary_settings_element, default value is: *'#sf_vkontakte_unnecessary_settings'*,    
These selectors appear on your page when application isn't installed or settings are not set. If you will not redefine these values, you should use default values, it means that you have to include partial _messages to you layout.php. Otherwise, write your own html (div tags with mentioned ids) and css code.
4. after_fetch_friends_done and after_fetch_friends_not are callbacks, that are called after fetching profiles and friends.

You can override all options by setting them in second options hash.

### Upload files to server - post to wall and upload photo to album

The app class has methods **upload_photo** and **post_walls**. They gets two parameters - callback and options. The options hash can contain these items:
 - for app.upload_photo method: album_title or album_id
 - for app.post_walls method: message and uids

On the server you should define class, for example myPhotoUploader. Then write name of this class to your app.yml. This class must have static method **get**, which returns a path to the file need to upload with @ in the begining. See example tools/sfVkontaktePhotoGetter.class.php. This method should get one parameter - it passes from client - **server_method_params**.

You can override name of the method and list of parameters by setting in options hash:
		server_method: 'getWallImage',
		server_method_params: {id: app.User.uid}

## To do:

1.  Remove dependency on jQuery.
2.  Add loader to ajax requests.
3.  Always fetch current user profile, even if app_vkontakte_enable_fetch is false.
4.  Audio and video upload wrappers.
5.  Set profile photo wrapper.
6.  Simple payment system.
