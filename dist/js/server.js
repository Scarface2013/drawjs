#!/usr/bin/node
var fs = require('fs');
var path = require('path');
var opts = {
    ca: fs.readFileSync("/home/master/certs/tfletch_tech.ca-bundle"),
    key: fs.readFileSync("/home/master/certs/tfletch_tech.key"),
    cert: fs.readFileSync("/home/master/certs/tfletch_tech.crt")
};
var compression = require('compression');
var app = require('express')();
var https = require('https').createServer(opts, app);
var server = require('socket.io')(https, { 'transports': ['websocket', 'polling'] });
var redirApp = require('express')();
var redirHttp = require('http').createServer(redirApp);
var parser = require('body-parser');
var Canvas = require('canvas');
// ********* SETUP *********
https.listen(443, function () {
    console.log('Server started. Listening on port 443');
});
// Redirect all traffic to https
redirHttp.listen(80);
redirApp.get('*', function (req, res) {
    res.redirect('https://www.tfletch.tech' + req.url);
});
app.use(parser.json());
app.use(compression());
function drawData(ctx, e) {
    ctx.beginPath();
    ctx.fillStyle = e.c;
    ctx.fillRect(e.x - e.s / 2, e.y - e.s / 2, e.s, e.s);
    ctx.closePath();
}
var Room = (function () {
    function Room(name, sizeX, sizeY) {
        this.name = name;
        this.canvas = new Canvas(sizeX, sizeY);
        this.ctx = this.canvas.getContext('2d');
    }
    Room.prototype.addMember = function (client) {
    };
    return Room;
}());
var Client = (function () {
    function Client(socket) {
        this.socket = socket;
    }
    Client.prototype.setRoom = function (room) {
        this.room = room;
    };
    Client.prototype.getRoom = function () {
        return this.room;
    };
    Client.prototype.getRoomName = function () {
        return this.room.name;
    };
    return Client;
}());
var room = new Room("Root", 1000, 1000);
console.log(__dirname);
// ********** ENDPOINTS ***************
app.get('/draw', function (req, res) {
    res.sendFile(path.resolve(__dirname + "/../html/draw.html"));
});
app.get('/source', function (req, res) {
    res.sendFile(path.resolve(__dirname + "/../js/server.js"));
});
app.get('/dist/:dir/:file', function (req, res) {
    res.sendFile(path.resolve(__dirname + "/../" + req.params.dir + "/" + req.params.file));
});
app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname + "/../html/home.html"));
});
app.get('/join', function (req, res) {
    res.sendFile(path.resolve(__dirname + "/../html/home.html"));
});
// ********* Socket handlers **********
server.on('connection', function (socket) {
    var client = new Client(socket);
    console.log(socket);
    socket.on('draw', function (data) {
        var data = JSON.parse(data);
        for (var key in data) {
            drawData(room.ctx, data[key]);
        }
        server.emit('receive', JSON.stringify(data));
    });
    socket.on('getCanvas', function (reason) {
        console.log("Sending canvas");
        if (reason == "Load") {
            socket.emit('setCanvas', room.canvas.toDataURL());
        }
        else {
            socket.emit('downloadCanvas', room.canvas.toDataURL());
        }
    });
});
