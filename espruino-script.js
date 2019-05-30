var credentials = require("credentials");

var WIFI_NAME = credentials.ssid;
var WIFI_OPTIONS = { password: credentials.password };

var wifi;

function onInit() {
    console.log("Connecting to wifi");
    wifi = require("EspruinoWiFi");
    wifi.connect(
        WIFI_NAME,
        WIFI_OPTIONS,
        function(e) {
            if (e) {
                console.log("Connection error: " + e);
                return;
            }
            console.log("WiFi connected");
            wifi.getIP(function(f, ip) {
                console.log("IP: ", ip);
            });
        }
    );
}
