# sfVkontaktePlugin plugin for symfony 1.3 and 1.4

##Requirements

*   Symfony 1.3 and more
*   Doctrine 1.2
*   php-curl module to make VK Api POST requests
*   jQuery 1.4.2 (maybe older version, not tested)

##Installation:

1.  First, fetch code *git://github.com/tyaga/sfVkontaktePlugin.git*. After that move downloaded source to your plugin directory and enable plugin in SF_ROOT/config/ProjectConfiguration.class.php:

		$ cp ~/sfVkontaktePlugin SF_ROOT/plugins

		// SF_ROOT/config/ProjectConfiguration.class.php
		$this->enablePlugins('sfVkontaktePlugin');

2.  Enable the sfVkontakteFetch module to fetch friends and upload photos to VK server. Add this line to your SF_ROOT/frontend/config/settings.yml file:

		enabled_modules: [default, sfVkontakteFetch]

3.  Change routing options in factories.yml to automatically add mandatory iframe parameters to every link on your site. Change parameter in your SF_ROOT/frontend/config/factories.yml

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

8.  Add initialization component to application layout.php. Add it inside the &lt;body&t; tag.

		<? include_component('sfVkontakteFetch', 'init')?>

9.  Put your VK App settings in settings.yml. Optionally add SF_ROOT/config/settings.yml to your VCS ignore. It allows you to have two instances of your VK App with different settings

		$ cp SF_ROOT/plugins/sfVkontaktePlugin/config/settings-example.yml SF_ROOT/config/settings.yml
		$ vi SF_ROOT/config/settings.yml

10.  Setup the database and model. Add to your user model actAs **sfVkontakteApiUser** behaviour.

		User:
		  actAs: [sfVkontakteApiUser]

  You can specify the name of the user model in your app.yml:

		all:
		  vkontakte:
		    user_model: Profile

  Default value is **User**.

11.  Build and load your schema, or import sql manually. Then publish plugin assets.

		$ ./symfony doctrine:build --all --and-load
		$./symfony plugin:publish:assets

That's all, folks!

## Configuration

As stated before, you must copy config/settings-example.yml to your config directory and change application_id and secret_key values.

Other configuration is in the app.yml file:

    	enable:
	      fetch: true
	      register_routes: true
	      add_js: true
	      append_get_params: true

	    user_model: User
	    upload_path: /web/sfVkontaktePlugin/images/uploads/

1.	enable_fetch - do or not save user profile, user friends and profiles of user friends to the database.
2.	enable_register_routes - do or not automatically add fetch and upload photo routes to the routing collection. If it is setted to false, you should write these routing rules in your routing.yml file.
3.	enable_add_js - do or not add javascript files to the response. If it is setted to false, you should add required JS to your view.yml file or to js compressor paths. The required js are "http://vkontakte.ru/js/api/xd_connection.js?2" and "/sfVkontaktePlugin/js/common.js".
4.	enable_append_get_params - do or not append to every uri of every link on your site the get params, which passed from iframe. If it is setted to false, you must manage security of your app by yourself.
5.	user_model - the name of the user model, obviously.
6.	upload_path - path to uploaded images for save photo and post to wall.

Condition of fetching friends and profiles is defined in sfVkontakteUser, in the getNeedFetch method. So you can write own method in your myUser class and redefine this behaviour. 

## Documentation

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

Model User has a number of fields. First, it has all the fields defined in plugin app.yml. Also it has **settings** field - api settings that user set. Finally, it has a fetched_at field - date and time when users settings was saved.

Use Doctrine Collection $this->user->Friends - to get friends list of current user.

These fields automatically updating every 24 hours.

### Client side, App and Upload classes

Usual way to use these classes is to write to your main.js code like this:

	$(function() {
		App.create(callback);
	});

The first parameter of the App.create method is the function, that will be called after all initialization. For example, you can write this code in that function. Lets have this html code, whatever:

	<div id='content'></div>
	<a id='post-photo' href='javascript:void(0);'>post_photo</a><br/>
	<a id='post-wall' href='javascript:void(0);'>post wall</a>

Then the code will be:

	var callback =  function (){
		// test use of the api object, retrieve viewer_id
		$('#content').append(App.User.first_name);

		// add onclick event - send photo to album
		$('#post-photo').click(function() {
			Upload.photo('new album', 'getPhoto', {}, function(){});
		});
		// add onclick event - send photo and message to the wall of user 11111
		$('#post-wall').click(function() {
			Upload.wall ('test', 11111, 'getPhoto', {}, function(){});
		});
	}

Also you can pass to the App.create method another two parameters:

*  after_fetch_friends_done - it will be called after fetching friends.
*  after_fetch_friends_not - it will be called if it is not nessesary to fetch friends.

Let's see on the Upload class. It has two public methods:

*  Upload.photo(album_title, server_method, server_method_params, callback )
*  Upload.wall(message, wall_id, server_method, server_method_params, callback )

On the server you should define a class with name sfVkontaktePhoto and this class must have a static method with name getPhoto, which returns a path to the file need to upload. This method should get one parameter - it passes from client - **server_method_params**. Yes, I know, it is the first candidate to fully redesign.

## Todo

1.	Rewrite getPhoto and all around it.
2.	Move FriendReference model to the actAs behaviour.
3.	Make post to wall work with a number of walls.