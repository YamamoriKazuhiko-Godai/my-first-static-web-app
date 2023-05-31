
        var isRunning = false;
        var alpha = -10, beta = 0, gamma = 0;             // ジャイロの値を入れる変数を3個用意
        var longitude = 136.606673, latitude=36.612411;   //現在地
        var targetLon = 136.607092, targetLat=36.611944;  //目標地点
        var distance=0, direction=RAD(-20);
        var position_options = {
            enableHighAccuracy: true,// 高精度を要求する
            timeout: 60000,// 最大待ち時間（ミリ秒）
            maximumAge: 0// キャッシュ有効期間（ミリ秒）
        };
        var _intervalmsec = 2000;
        var track_stat = 'ready';

        var xmlhttp = new XMLHttpRequest();
        var baseurl = 'https://ichimillgodaiproxyapp.azurewebsites.net/track/';
//        var baseurl = 'http://localhost:3000/track/';

        const id = '2207-apiUser';
        const key = '87e3f1974d64fdff71c80a7da17a0201';
        const device = 'lc10629';

        var canvas = document.getElementById("canvas"); // ★canvas要素を取得
        var context = canvas.getContext("2d");          // ★絵を描く部品を取得

        var _timerid=0;

        function RAD(deg){
            return deg/180.0 * Math.PI;
        }
        function DEG(rad){
            return rad/Math.PI * 180.0;
        }
        //目標地点までの距離と角度
        function CalcTarget(){
            var Px = RAD(longitude);
            var Py = RAD(latitude);
            var Qx = RAD(targetLon);
            var Qy = RAD(targetLat);

            //北を0として時計回り+方向角度
            var dy = Math.cos(Qy)*Math.sin(Qx-Px);
            var dx = Math.cos(Py)*Math.sin(Qy) - Math.sin(Py)*Math.cos(Qy)*Math.cos(Qx-Px);
            direction = Math.atan2(dy,dx);

            var Rx = 6378137.0;
            var Ry = 6356752.314;
            var P = (Py+Qy)*0.5;
            var E = Math.sqrt((Rx*Rx-Ry*Ry)/(Rx*Rx));
            var W = Math.sqrt(1-E*E*Math.sin(P)*Math.sin(P));
            var M = Rx*(1-E*E) / Math.pow(W,3);
            var N = Rx/W;
            var Dx = Qx-Px;
            var Dy = Qy-Py;
            //メートル距離
            distance = Math.sqrt( Math.pow(Dy*M,2) + Math.pow(Dx*N*Math.cos(P),2));

            return [distance, direction];
        }

        // データを表示する displayData 関数
        function displayData() {
            var txt = document.getElementById("txt");   // データを表示するdiv要素の取得
//            txt.innerHTML = "alpha: " + String(alpha) + "<br>"  // x軸の値
//                + "beta:  " + String(beta) + "<br>"  // y軸の値
//                + "gamma: " + String(gamma) + "<br>" // z軸の値
                txt.innerHTML = 
                 "latitude: " + String(latitude) + "<br>" //現在地
                + "longitude: " + String(longitude) + "<br>"
                + "distance: " + distance.toFixed(1) + "<br>"//現在地から目標地点までの距離
//                + "direction" + String(DEG(direction)) + "<br>";//現在地から目標地点までの方位
                + "track status:" + track_stat + "<br>";//測位状態
        }

        // コンパスのような絵を描く drawOrientation 関数
        function drawOrientation() {
            var centerX = canvas.width / 2;             // canvasの中心のX座標
            var centerY = canvas.height / 2;	        // canvasの中心のY座標
            var radius = 100;                           // 枠円の半径および針の長さ
            var radianAlpha = RAD(alpha);               // 常に北向きかつ角度をラジアンに変換
            var radianAlphaRev = RAD(360-alpha);        // 常に北向きかつ角度をラジアンに変換
            context.clearRect(0, 0, canvas.width, canvas.height);   // canvasの内容を消す clearRect(x, y, w, h)

            context.beginPath();                        // 描画開始
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);  // 枠円を描く
            context.strokeStyle = "rgb(0, 0, 0)";       // 枠円の線の色
            context.lineWidth = 3;                      // 線の太さ
            context.stroke();                           // 線を描画

            // 十字方位線
            context.beginPath();                        // 描画開始
            context.strokeStyle = "rgb(0, 0, 0)";     // 針の線の色
            context.lineWidth = 1;                      // 線の太さ
            context.moveTo(centerX - Math.cos(radianAlphaRev - Math.PI / 2) * radius,
                centerY - Math.sin(radianAlphaRev - Math.PI / 2) * radius);
            context.lineTo(centerX + Math.cos(radianAlphaRev - Math.PI / 2) * radius,
                centerY + Math.sin(radianAlphaRev - Math.PI / 2) * radius);
            context.moveTo(centerX - Math.cos(radianAlphaRev) * radius,
                centerY - Math.sin(radianAlphaRev) * radius);
            context.lineTo(centerX + Math.cos(radianAlphaRev) * radius,
                centerY + Math.sin(radianAlphaRev) * radius);
            context.stroke();                           // 線を描画
            
            // 目標への方向線（太赤）
            context.beginPath();                        // 描画開始
            context.moveTo(centerX, centerY);           // 中心に移動
            context.lineTo(centerX + Math.cos(direction - radianAlpha- Math.PI / 2) * radius,
                centerY + Math.sin(direction - radianAlpha- Math.PI / 2) * radius);
            context.strokeStyle = "rgb(255, 0, 0)";     // 針の線の色
            context.lineWidth = 5;                      // 線の太さ
            context.stroke();                           // 線を描画

            //東西南北　文字
            context.beginPath();  
            context.font = '11pt Arial';
            context.fillStyle = 'rgba(0, 0, 0)';
            context.textAlign = 'center';
            context.textBaseline = 'middle'
            context.fillText('西', centerX - Math.cos(radianAlphaRev) * (radius+15),
                centerY - Math.sin(radianAlphaRev) * (radius+15));
            context.fillText('東', centerX + Math.cos(radianAlphaRev) * (radius+15),
                centerY + Math.sin(radianAlphaRev) * (radius+15));
            context.fillText('北', centerX + Math.cos(radianAlpha+Math.PI / 2) * (radius+15),
                centerY - Math.sin(radianAlphaRev+Math.PI / 2) * (radius+15));
            context.fillText('南', centerX - Math.cos(radianAlpha+Math.PI / 2) * (radius+15),
                centerY + Math.sin(radianAlphaRev+Math.PI / 2) * (radius+15));
            context.stroke();

            //目標までの距離
            context.beginPath();  
            context.font = '11pt Arial';
            context.fillStyle = 'rgba(255, 0, 0)';
            context.textAlign = 'center';
            context.textBaseline = 'middle'
            context.fillText(distance.toFixed(1)+'m', centerX + Math.cos(direction - radianAlpha- Math.PI / 2) * (radius+35),
                centerY + Math.sin(direction - radianAlpha- Math.PI / 2) * (radius+35));
            context.stroke();
        }

        /*
        //GPS位置測位
        navigator.geolocation.watchPosition((e) => {
                latitude = e.coords.latitude;
                longitude = e.coords.longitude;
            },
            (error)=>{},
            position_options
        );
        */

        function connect() {
            var url = baseurl + 'connect?id=' + id + '&key=' + key + '&device=' + device;
            xmlhttp.open("GET", url);
            xmlhttp.send();
  
//         _timerid = setInterval(onTimer, _intervalmsec);
        };
        function disconnect() {
            clearInterval(_timerid);
            _timerid = 0;

            var url = baseurl + 'disconnect?device=' + device;
            xmlhttp.open("GET", url);
            xmlhttp.send();
        };
        //Timerトリガー  
        function onTimer() {
              var url = baseurl + 'position?device=' + device;
              xmlhttp.open("GET", url);
              xmlhttp.send();
        };
        xmlhttp.onreadystatechange = () => {

            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                var res = xmlhttp.responseText;
//                console.log(xmlhttp.responseText);
          
                var json = JSON.parse(res);
                var restype = json['RESTYPE'];
          
                if( restype == 'CONNECT'){
                    _timerid = setInterval(onTimer, _intervalmsec);

                } else if(restype == 'DISCONNECT'){
                    track_stat = 'pause';
                    displayData();
//                    alert( 'トラッキングを停止しました' );

                } else if(restype == 'TRACK'){
                    if( json['LATITUDE'] !== undefined){
                        latitude = json['LATITUDE'];
                        longitude = json['LONGITUDE'];
                        track_stat = json['POSITION_TYPE_NAME'];
                        CalcTarget();
                        drawOrientation();
                        displayData();
                    }
                }
            }
        }

        //方位センサー
        const requestDeviceOrientationPermission = () => {
            targetLat = document.getElementById('lat').value;
            targetLon = document.getElementById('lon').value;

            if( isRunning==true ){
                isRunning = false;
                window.removeEventListener('deviceorientation');
                return;
            }

            DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    const elem = document.getElementById("txt");
                    elem.innerText = "start access to the sensor";
                    isRunning = true;

                    // 許可を得られた場合、deviceorientationをイベントリスナーに追加
                    window.addEventListener('deviceorientation', dat => {
                        // deviceorientationのイベント処理
                        //alpha = dat.alpha;  // z軸（表裏）まわりの回転の角度（反時計回りがプラス）
                        alpha = dat.webkitCompassHeading;//北の方向角
                        beta = dat.beta;   // x軸（左右）まわりの回転の角度（引き起こすとプラス）
                        gamma = dat.gamma;  // y軸（上下）まわりの回転の角度（右に傾けるとプラス）

                        CalcTarget();
                        displayData();      // displayData 関数を実行
                        drawOrientation();  // 方向を描く
                    })
                }
            })
        }

        // ボタンクリックでrequestDeviceOrientationPermission実行
        const startButton = document.getElementById("start-button");
////        startButton.addEventListener('click', requestDeviceOrientationPermission, false);
        startButton.addEventListener('click', connect, false);

        const pauseButton = document.getElementById("pause-button");
        pauseButton.addEventListener('click', disconnect, false);

        CalcTarget();
        drawOrientation();
        displayData();
