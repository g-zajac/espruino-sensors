var credentials = require("credentials");
var dht = require("DHT22").connect(A4);

var WIFI_NAME = credentials.ssid;
var WIFI_OPTIONS = { password: credentials.password };
var MQTT_HOST = credentials.mqtthost;
var MQTT_OPTIONS = {
    // ALL OPTIONAL - the defaults are below
    client_id: credentials.mqttclientid,
    keep_alive: 60, // keep alive time in seconds
    port: 1883, // port number
    clean_session: true,
    username: credentials.mqttuser,
    password: credentials.mqttpassword,
    protocol_name: "MQTT", // or MQIsdp, etc..
    protocol_level: 4 // protocol level
};
var mqttpath = credentials.mqttpath;

var wifi;
var mqtt = require("MQTT").create(MQTT_HOST, MQTT_OPTIONS);

function onInit() {
    connectWiFi();
}

function connectWiFi() {
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
                mqttConnect();
            });
        }
    );
}

function mqttConnect() {
    mqtt.connect();
    mqtt.on("connected", function() {
        console.log("MQTT connected!");
        mqtt.publish(mqttpath + "/status", "connected");
    });
    mqtt.on("disconnected", function() {
        console.log("MQTT disconnected...reconecting");
        setTimeout(function() {
            mqtt.connect();
        }, 1000);
    });
}

setInterval(function() {
    if (!mqtt) return;
    console.log("publishing mqtt messeges...");
    dht.read(function(sensor) {
        mqtt.publish(mqttpath + "/temperature", sensor.temp);
        mqtt.publish(mqttpath + "/humidity", sensor.rh);
    });
    mqtt.publish(mqttpath + "/cputemp", E.getTemperature());
}, 3 * 1000);
