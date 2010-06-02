<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
  <head>
    <title>Тест</title>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <style type="text/css">
/* <![CDATA[ */
body {
  margin: 0;
  padding: 0;
  font-family: Tahoma;
  font-size: 11px;
  background: #ffffff;
}
/* ]]> */
    </style>
  </head>
  <body>
    <!--script src="vk_api.js" type="text/javascript"></script-->
    <script src="http://vk-jsapi.googlecode.com/svn/trunk/vk_api.min.js" type="text/javascript"></script>

    <div>
      <a href="#" onclick="api.external.showSettingsBox(); return false;" title="">Изменить свойства</a> |
      <a href="#" onclick="custom_api_call(); return false;" title="">Проверка API</a>
    </div>

    <pre id="text"><strong>Результат:</strong><br /></pre>

    <script type="text/javascript">//<![CDATA[
var e2_id = 0;

var api = new vk_api(
    'AppSecret',
    function() {

        api.callMethod('setTitle', 'MY SUPER APP');

        api.makeInstall(function() {
            document.getElementById('text').innerHTML += 'Application added\n';
            api.makeSettings(api.SETT_FRIENDS | api.SETT_WALL);
        });

        api.addCallback(
           'onSettingsChanged',
            function(settings) {
                document.getElementById('text').innerHTML += 'E1. New parameters: ' + String(settings) + '\n';
            }
        );

        e2_id = api.addCallback(
           'onSettingsChanged',
            function(settings) {
                document.getElementById('text').innerHTML += 'E2. New parameters: ' + String(settings) + '\n';
            }
        );

        var o = api;
        for (var v in o) {
            document.getElementById('text').innerHTML += 'api.' + v + '\n';
        }
        document.getElementById('text').innerHTML += '******************************************************\n';

        var o = api.external;
        for (var v in o) {
            document.getElementById('text').innerHTML += 'api.external.' + v + '\n';
        }
        document.getElementById('text').innerHTML += '******************************************************\n';

        var o = api.params;
        for (var v in o) {
            document.getElementById('text').innerHTML += 'api.params.' + v + ' = ' + o[v] + '\n';

            //first API call
            if (v == 'api_result') {
                for (var v1 in o[v].response) {
                    document.getElementById('text').innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;api.params.' + v + '.response.' + v1 + ' = ' + o[v].response[v1] + '\n';
                }
                for (var v1 in o[v].error) {
                    document.getElementById('text').innerHTML += '&nbsp;&nbsp;&nbsp;&nbsp;api.params.' + v + '.error.' + v1 + ' = ' + o[v].error[v1] + '\n';
                }
            }
        }
        document.getElementById('text').innerHTML += '******************************************************\n';
    },
    function() {
        document.getElementById('text').innerHTML += 'Failure\n';
    },
    true
);

function custom_api_call() {
    api.removeCallback('onSettingsChanged', e2_id);

    api.call(
        'getProfiles',
        {
            uids: '50783699,7560201',
            fields: [
                'uid', 'first_name', 'last_name', 'nickname',
                'bdate', 'city', 'country', 'photo',
                'has_mobile'
            ]
        },
        function(data) {
            var o = data;
            for (var v in o) {
                document.getElementById('text').innerHTML += v + ' = ' + o[v] + '\n';
                if (typeof o[v] == 'object') {
                    arguments.callee(o[v]);
                    document.getElementById('text').innerHTML += '\n';
                }
            }

            api.external.resizeWindow(680, document.body.clientHeight + 50);
        }
    );
}
    //]]></script>
  </body>
</html>
