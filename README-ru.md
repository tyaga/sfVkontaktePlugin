# Плагин sfVkontaktePlugin для symfony 1.4

English documentation - README.md

**Что это такое?**

Плагин разработан для упрощения создания IFrame-приложений [VKontakte](http://vk.com/) с использованием php-фреймворка [Symfony](http://www.symfony-project.org/).

*VKontakte это [самая популярная социальная сеть](http://en.wikipedia.org/wiki/Vkontakte) в СНГ. В ней зарегистрированно около 75 миллионов пользователей.*

Плагин предоставляет:

1.  Php класс для совершения защищённых запросов к VKontakte api;
2.  JS библиотеку-обертку для установки приложения, установки правильных настроек, загрузки фото и публикации на стену;
3.  Автоматическое сохранение профиля текущего пользователя и его друзей в вашу БД.

Плагин находится в стадии разработки, но разработка в основном направлена на увеличение возможностей настройки, но не на api. В целом он в работоспособном состоянии.

[Тестовое приложение, основанное на плагине](http://vkontakte.ru/app1889525). Cкоро будет одобрено администрацией.

##Требования:

*   [Symfony](http://www.symfony-project.org/) 1.3 и выше. ORM - только Doctrine.
*   [jQuery](http://jquery.com) 1.4.2 (может быть и ранние версии, не тестировал)
*   модуль php-curl для POST-запросов к VK Api

##Установка:

*  Либо используйте **git submodule**, либо просто склонируйте **git clone** репозиторй в папку с плагинами проекта. Затем активируйте плагин в файле SF_ROOT/config/ProjectConfiguration.class.php:

		// SF_ROOT/config/ProjectConfiguration.class.php
		$this->enablePlugins('sfVkontaktePlugin');

*  Активируйте модуль sfVkontakteFetch для того, чтобы позволить плагину сохранять профили и друзей и загружать фото на сервера ВК. Добавьте в файл SF_ROOT/frontend/config/settings.yml:

		enabled_modules: [default, sfVkontakteFetch]

*  Измените настройки роутинга в файле factories.yml для того, чтобы автоматически добавлять к каждой ссылке параметры, с которыми запустилось приложение из IFrame. Измените настройку в файле SF_ROOT/frontend/config/factories.yml. Если вы не хотите автоматически добавлять параметры, установите настройку **enable_append_get_params: false*. См. раздел Конфигурация.

		all:
		  routing:
		    class: sfVkontaktePatternRouting

*  Измените настройки безопасности в файле SF_ROOT/frontend/config/security.yml

		default:
		  is_secure: true

*  Скачайте библиотеку jQuery и добавьте ссылку на неё в view.yml (ну или подключите jQuery любым другим способом)

		javascripts:    [lib/jquery-1.4.2, main]

*  Измените класс, от которого унаследован класс myUser в файле SF_ROOT/frontend/lib/myUser.class.php

		class myUser extends sfVkontakteSecurityUser {

*  Измените класс, от которого унаследованы классы actions в файлах actions.class.php .

		class mainActions extends sfVkontakteActions {

*  Добавьте партиал в layout.php. Его надо добавить в теге &lt;head&gt; перед включением других JS-ов.

		<? include_partial('sfVkontakteFetch/init_js_options')?>

*  Если вы хотите, чтобы выводились стандартные сообщения о необходимости установки и настройке, то добавьте партиал **_messages** в layout.php . Включите его в теге &lt;body&gt;. В ином случае, задайте id тегов **div** , содержащих ваши сообщения об установке во второй параметр **options** вызова конструктора vkApp . См. раздел Клиентская сторона.

		<? include_partial('sfVkontakteFetch/messages')?>

*  Скопируйте файл settings-example.yml в папку настроек **config**. Затем поместите настройки вашего приложения в файл settings.yml. Вы можете скопировать эти настройки со страницы редактирования вашего приложения на сайте vk. Также вы можете добавить файл SF_ROOT/config/settings.yml в игнор вашей системы VCS. Это позволит вам иметь несколько приложений со своими настройками, например, для разработки.

		$ cp SF_ROOT/plugins/sfVkontaktePlugin/config/settings-example.yml SF_ROOT/config/settings.yml
		$ vi SF_ROOT/config/settings.yml

*  Сделайте doctrine:build --and-load, или загрузите sql в вашу БД самостоятельно. Затем - plugin:publish-assets.

		$ ./symfony doctrine:build --all --and-load
		$./symfony plugin:publish-assets

Вот и всё.

## Конфигурация:

Как указано выше, вы должны скопировать **config/settings-example.yml** в папку config и изменить **application_id** и **secret_key**.

Остальная настройка - в файле app.yml:

	    enable_fetch: true
	    enable_register_routes: true
	    enable_add_js: true
	    enable_append_get_params: true

	    photo_getter_class: vkPhotoGetter

1.	**enable_fetch** - Сохранять или нет профиль пользователя и его друзей и их профили в БД;
2.	**enable_register_routes** - добавлять или нет правила роутинга *fetch* и *upload photo* . Если эта настройка выключена, то вы должны самостоятельно написать такие роутинг-правила в вашем routing.yml;
3.	**enable_add_js** - добавлять или нет javascript в response. Если эта настройка выключена, то вы должны самостоятельно добавить необходимые скрипты в файл **view.yml**. Необходимые JS это **"http://vkontakte.ru/js/api/xd_connection.js?2"** и **"/sfVkontaktePlugin/js/common.js"**;
4.	**enable_append_get_params** - добавлять или нет к каждой ссылке на сайте GET параметры, переданные из IFrame. Если эта настройка выключена, то вы должны управлять защищённостью вашего приложения самостоятельно;
5.	**photo_getter_class** - класс, используемый для получения пути до файла, который нужно загрузить на сервер VK. См. раздел ** Загрузка файлов на сервер**.

Модель PluginsfVkontakteUser имеет метод **getNeedFetch**. Этот метод возвращает, есть ли необходимость сохранять профиль и друзей. Вы можете переопределить этот метод в сгенерированной модели **sfVkontakteUser** для того, чтобы переопределить это.

## Документация:

### Серверная сторона, класс sfVkontakteTools

sfVkontaktePlugin предоставляет вам класс sfVkontakteTools, который позволяет вам вызывать защищённые методы VK Api.
В PLUGIN/config/app.yml вы можете увидеть список всех защищённых методов, предоставляемых VK с их параметрами. В любом месте вашего проекта вы можете написать что-то наподобие:

		$this->getUser()->getBalance( array('uid' => $this->getUser()->id) );

или
		sfVkontakteTools::getInstance()->getBalance( array('uid' => $this->getUser()->id) );

, где getBalance это название метода.

Если вы хотите, к примеру, вызвать метод *sendNotification*, вы, скорее всего, захотите передать строку на русском языке (в utf8) в параметре *message*. Класс обработает это автоматически и создаст правильную подпись (signature) для такого запроса.

		// in some action
		$this->getUser()->sendNotification(array('uids'=> $this->getUser()->id, 'message'=> 'it works!'));

### Ссылки, роутинг и безопасность

Плагин позволяет VKontakte проверять, авторизован ли пользователь или нет. Vkontakte делает это путём передачи GET параметров в iframe, которые плагин проверяет на соответствие ключу. Это означает, что мы должны передавать эти GET-параметры в любой ссылке на нашем сайте. Я выбрал метод изменения роутинг-класса для того, чтобы это сделать.
В целом это означает, что вы должны писать все ссылки на сайте с использованием функций link_to или url_for. Другое требование - все приложения проекта, доступные из iframe VK должны быть защищёнными (is_secure: true в security.yml).

### Пользователь

В любом месте вашего проекта у вас есть:

sfVkontakteUser (модель)
		$this->vkontakteUser // в actions, экземпляр модели
		$vkontakteUser 		// то же самое в шаблонах

и защищённый пользователь vkontakte
		$this->getUser() // в actions, экземпляр sfVkontakteSecurityUser
		$sf_user 	 // в шаблонах

В модели sfVkontakteUser есть набор полей. Прежде всего, модель хранит все поля профиля пользователя VK, перечисленные в app.yml плагина. Также модель имеет поле **settings** настройки, которые выбрал пользователь. Наконец, в модели есть поле fetched_at время последнего сохранения профиля, друзей и настроек.

Используйте Doctrine Collection $this->vkontakteUser->Friends - для того, чтобы получить коллекцию друзей текущего пользователя.

Эти поля автоматически сохраняются каждые 24 часа (это может быть переопределено в методе getNeedFetch вашего класса myUser).

### Клиентская часть, класс vkApp

Если вы хотите видеть процесс загрузки и работы js-кода, то вы можете задать "DEBUG = true;". 

Стандартный путь использования класса vkApp таков. В вашем main.js:

	$(function() {
		app = new vkApp(callback);
	});

Первый параметр конструктора это коллбек-функция, которая представляет собой процесс выполнения приложения - она будет выполнена только после установки приложения и после того, как пользователь установит необходимые настройки. Например, вы можете использовать такой код. Пусть у нас есть HTML:

	<div id='content'></div>
	<a id='post-photo' href='javascript:void(0);'>post_photo</a><br/>
	<a id='post-wall' href='javascript:void(0);'>post wall</a>

Тогда код будет такой:

	var callback =  function (){
		// тестовое использование объекта app, получение параметров пользователя
		$('#content').append(app.User.first_name + ' ' + app.User.last_name);

		// событие onclick - отправить фото в альбом
		$('#post-photo').click(function() {
			app.upload_photo(function(){},
			{
				album_title: 'new album'
			//	album_id: ##album id to post to ##
			})
		});

		// событие onclick - отправить фото и сообщение на стены
		$('#post-wall').click(function() {
			app.post_walls(function(){},
			{
				message: 'test',
				uids: [## array of wall ids for post on ##]
			});
		});
	}

Второй параметр конструктора - это настройки options. По умолчанию настройки такие:

1. mandatory_settings. Значение по умолчанию: *Settings.FRIENDS | Settings.NOTIFY | Settings.PHOTOS*. Эти настройки необходимы для выполнения приложения.
В случае, если такие настройки не установлены, приложение будет запрашивать их каждую загрузку.
2. unnecessary_settings: Значение по умолчанию: *Settings.MENU*. Если настройка не установлена, то появится сообщение.
3. install_element, значение по умолчанию: *'#sf_vkontakte_install'*,    
mandatory_settings_element, значение по умолчанию: *'#sf_vkontakte_settings'*,    
unnecessary_settings_element, значение по умолчанию: *'#sf_vkontakte_unnecessary_settings'*,    
Дивы с этими id становятся видны в случае, если приложение не установлено или не выбраны заданные настройки соответственно. Если вы не переопределили эти настройки, то используются заданные по умолчанию, то есть вам надо включить партиал _messages в layout.php. В ином случае, вы можете написать свой html (div-теги с заданными id) и css.
4. after_fetch_friends_done и after_fetch_friends_not коллбеки, вызываются после успешного или неуспешного сохранения профиля и друзей.

Вы можете переопределить эти настройки во втором параметре конструктора.

### Загрузка файлов на сервер - публикация на стену и загрузка изображений в альбомы

В классе vkApp есть методы **upload_photo** и **post_walls**. Они принимают по два параметра callback и options. Параметр options может содержать такие элементы:
 - для метода app.upload_photo: album_title или album_id
 - для метода app.post_walls: message и uids

На сервере вы должны написать класс (myPhotoUploader). Имя этого класса надо написать в вашем app.yml. В этом классе должен быть статический метод get **get**, который возвращает путь к файлу, который надо загрузить на сервер VK, в начале строки с путём должен стоять символ @. Для примера можете посмотреть класс tools/sfVkontaktePhotoGetter.class.php. Этот метод принимает один параметр - массив, который приходит с клиента - **server_method_params**.

Вы можете переопределить эти вызываемый метод и параметры во втором параметре js-вызова:
		server_method: 'getWallImage',
		server_method_params: {id: app.User.uid}

## Развитие:

1.  Убрать зависимость от jQuery.
2.  Сделать, чтобы профиль пользователя сохранялся всегда, даже если настройка **app_vkontakte_enable_fetch** отключена.
3.  Сделать загрузку видео и аудио.
4.  Сделать обёртку для установки фото профиля.
5.  Сделать простую систему обработки платежей.
