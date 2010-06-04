# sfVkontaktePlugin plugin for symfony 1.3

##Requirements

*   Symfony 1.3 and more
*   Doctrine 1.2
*   php-curl module to make VK Api POST requests
*   jQuery 1.4.2 (maybe older version, not tested)

##Installation:

1.  First, fetch code *git://github.com/tyaga/sfVkontaktePlugin.git* or download [source](http://github.com/tyaga/sfVkontaktePlugin/downloads). After that move downloaded source to your plugin directory:

		$ cp ~/sfVkontaktePlugin SF_ROOT/plugins

2.  Enable plugin. To do it put this line to your SF_ROOT/config/ProjectConfiguration.class.php file:

		$this->enablePlugins('sfVkontaktePlugin');

3.  Enable the sfVkontakteFetch module to fetch friends and upload photos to VK server. Add this line to your SF_ROOT/frontend/config/settings.yml file:

		enabled_modules: [default, sfVkontakteFetch]

4.  Change routing options in factories.yml to automatically add mandatory iframe parameters to every link on your site. Change parameter in your SF_ROOT/frontend/config/factories.yml

		all:
		  routing:
		    class: sfVkontaktePatternRouting

5.  Change security settings of your application in SF_ROOT/frontend/config/security.yml

		default:
		  is_secure: true

6.  Download jQuery library and add link to it into view.yml of your application (or use another way to enable jQuery)

		javascripts:    [lib/jquery-1.4.2, main]

7.  Change inheritance of the myUser class in SF_ROOT/frontend/lib/myUser.class.php

		class myUser extends sfVkontakteUser {

8.  Change inheritance of your actions.class.php .
		class mainActions extends sfVkontakteActions {

9.  Add initialization component to application layout.php. Add it inside the <body> tag.

		<? include_component('sfVkontakteFetch', 'init')?>

10.  Put your VK App settings in settings.yml. Optionally add SF_ROOT/config/settings.yml to your VCS ignore. It allows you to have two instances of your VK App with different settings

		$ cp SF_ROOT/plugins/sfVkontaktePlugin/config/settings-example.yml SF_ROOT/config/settings.yml
		$ vi SF_ROOT/config/settings.yml

11.  Setup the database and model. Add to your User model actAs **Apiuser** behaviour. Currently you have to use name **User** to you user model, I will rewrite it soon.

		User:
		  actAs: [Apiuser]

12.  Build and load your schema, or import sql manually. Then publish plugin assets.

		$ ./symfony doctrine:build --all --and-load
		$./symfony plugin:publish:assets

That's all, folks!

## Documentation

### Server side, sfVkontakteTools class

sfVkontaktePlugin provides you sfVkontakteTools class, that allows you to call secure VK Api function.
In PLUGIN/config/app.yml you can see all secure methods provided by VK with theirs parameters. In any part of your project you can write:

		$this->getUser()->secure_getBalance( array('uid' => $this->getUser()->id) );

or
		sfVkontakteTools::getInstance()->secure_getBalance( array('uid' => $this->getUser()->id) );

, where secure_getBalance is the name of the method, and it calls with array of proper parameters.

If you need to call for example the *secure.sendNotification* method, you would like to pass utf8 string (in russian) in the *message* parameter. Plugin will handle it and automaticaly make proper signature to the call.

### Links, routing, and security

I let VKontakte to check authority of user. Vkontakte make it by checking GET parameters passed to the iframe. It means that we should pass to every link on our site these parameters. I choose the routing way to do it.
Generally, it means that you should write every link code on the site by link_to or url_for functions. Also, all your applications that accessible from VK Iframe must be secured.

### User

In any place in your code you have an $user variable

		$this->user // in actions, instance of model User class
		$user 		// the same one in templates

and

		$this->getUser() // in actions, instance of sfVkontakteUser
		$sf_user 		 // in templates

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

