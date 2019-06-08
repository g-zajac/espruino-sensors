const version = 1.7;
var credentials = require("credentials");
var dht = require("DHT22").connect(A4);
I2C1.setup({ scl: B6, sda: B7 });
var gas = require("CCS811").connectI2C(I2C1);

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

var movmentSensed;

function onInit() {
    connectWiFi();
}

setWatch(
    function(e) {
        console.log("doppler ON");
        LED1.write(1);
        movmentSensed = true;
    },
    A7,
    { repeat: true, edge: "rising" }
);

function connectWiFi() {
    // console.log("Connecting to wifi");
    wifi = require("EspruinoWiFi");
    wifi.connect(
        WIFI_NAME,
        WIFI_OPTIONS,
        function(e) {
            if (e) {
                // console.log("Connection error: " + e);
                return;
            }
            // console.log("WiFi connected");
            wifi.getIP(function(f, ip) {
                // console.log("IP: ", ip);
                mqttConnect();
            });
        }
    );
}

function mqttConnect() {
    mqtt.connect();
    mqtt.on("connected", function() {
        // console.log("MQTT connected!");
        mqtt.publish(mqttpath + "/system/status", "connected");
    });
    mqtt.on("disconnected", function() {
        // console.log("MQTT disconnected...reconecting");
        setTimeout(function() {
            mqtt.connect();
        }, 1000);
    });
}

setInterval(function() {
    if (mqtt) {
        LED2.write(1);
        // console.log("publishing mqtt messeges...");
        if (movmentSensed) {
            mqtt.publish(mqttpath + "/sensor/doppler/state", 1);
            LED1.write(0);
            movmentSensed = false;
        }
        if (gas.get().new) {
            mqtt.publish(mqttpath + "/sensor/ccs811/co2", gas.get().eCO2);
            mqtt.publish(mqttpath + "/sensor/ccs811/tvoc", gas.get().TVOC);
        }
        dht.read(function(sensor) {
            mqtt.publish(mqttpath + "/system/version", version);
            mqtt.publish(mqttpath + "/sensor/dht22/temperature", sensor.temp);
            mqtt.publish(mqttpath + "/sensor/dht22/humidity", sensor.rh);
        });
        mqtt.publish(
            mqttpath + "/cputemp",
            Math.round(E.getTemperature() * 10) / 10
        );
        LED2.write(0);
    }
}, 5 * 1000);
