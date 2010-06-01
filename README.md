# sfVkontaktePlugin plugin (for symfony 1.3 (1.4))

##Installation:

1.  First, fetch code from github git://github.com/tyaga/sfVkontaktePlugin.git
or download [source](http://github.com/tyaga/sfVkontaktePlugin/downloads)

Move downloaded source to your plugin directory:

		$ cp ~/sfVkontaktePlugin SF_ROOT/plugins

2.  Then enable plugin. To do it put this line to your SF_ROOT/config/ProjectConfiguration.class.php file:

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

8.  Add initialization component to application layout.php. Add it inside the <body> tag.

		<? include_component('sfVkontakteFetch', 'init')?>

9.  Put your VK App settings in settings.yml

		$ cp SF_ROOT/plugins/sfVkontaktePlugin/config/settings-example.yml SF_ROOT/config/settings.yml
		$ vi SF_ROOT/config/settings.yml

Optionally add SF_ROOT/config/settings.yml to your VCS ignore. It allow you to have two instances of your VK App with different settings

10.  Setup the database and model, add to your schema.yml this model schema:

		User:
		  actAs:
	    	Timestampable: { updated: { disabled: true } }
		    Apiuser:

Currently you have to use name "User" to you user model, I will rewrite it soon.

11.  Build and load your schema, or import sql manually. Then publish plugin assets

		$ ./symfony doctrine:build --all --and-load
		$./symfony plugin:publish:assets
