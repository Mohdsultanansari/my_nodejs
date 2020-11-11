const http = require("http");
const fs = require("fs");
const express = require('express');
const app = express();
const isset = require("isset");
var requests = require("requests");
const port = process.env.PORT || 8000;

const homeFile = fs.readFileSync("home.html", "utf-8");

const replaceVal = (tempVal, orgVal) => {
    let temperature = tempVal.replace("{%tempval%}", orgVal.main.temp);
    temperature = temperature.replace("{%tempmin%}", orgVal.main.temp_min);
    temperature = temperature.replace("{%tempmax%}", orgVal.main.temp_max);
    temperature = temperature.replace("{%location%}", orgVal.name);
    temperature = temperature.replace("{%country%}", orgVal.sys.country);
    temperature = temperature.replace("{%tempstatus%}", orgVal.weather[0].main);

    return temperature;
};

function get_ip(ip) {
    requests(`http://ipinfo.io/${ip}/json`).on("data", (ip_data) => {
        ip_data = JSON.parse(ip_data);
        fs.writeFileSync("read.txt", JSON.stringify(ip_data));
    })
}

var user_state = '';
app.get('/', (req, res) => {

    if (req.url == "/" || req.query !== {}) {
        let ip = req.connection.remoteAddress;
        // let ip = '47.30.180.127';
        if (isset(req.query.state) == false) {
            get_ip(ip);
            var data = fs.readFileSync("./read.txt", "utf-8");
            data = JSON.parse(data);
            user_state = data.region;
        } else {
            user_state = req.query.state;
        }

        requests(
                `http://api.openweathermap.org/data/2.5/weather?q=${user_state}&units=metric&appid=b14425a6554d189a2d7dc18a8e7d7263`
            )
            .on("data", (chunk) => {
                const objdata = JSON.parse(chunk);
                if (objdata.cod != 200) {
                    return res.redirect('/');
                }
                const arrData = [objdata];
                // console.log(arrData[0]);
                const realTimeData = arrData
                    .map((val) => replaceVal(homeFile, val))
                    .join("");
                res.write(realTimeData);
                // console.log(arrData);
            })
            .on("end", (err) => {
                if (err) return console.log("connection closed due to errors", err);
                res.end();
            });
    } else {
        res.end("File not found");
    }
});

app.listen(port, () => {
    console.log(`listening to the port no at ${port}`);
});