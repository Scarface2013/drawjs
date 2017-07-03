#!/usr/bin/node

// *********** OBJECT INITIALIZATION ************
var fs = require('fs');
var opts = {
  key: fs.readFileSync("/home/master/certs/tfletch_tech.key"),
  cert: fs.readFileSync("/home/master/certs/tfletch_tech.crt")
};
var app = require('express')();
var https = require('https').createServer(opts,app);
var io = require('socket.io')(https, {'transports': ['websocket', 'polling']});
var redirApp = require('express')();
var redirHttp = require('http').createServer(redirApp);
var parser = require('body-parser');
var Canvas = require('canvas');
var canvas = new Canvas(1000,1000);
var ctx = canvas.getContext('2d');

// ********* SETUP *********
https.listen(8080, function(){
  console.log('Server started. Listening on port 8080');
});


// Redirect all traffic to https@8080
redirHttp.listen(80);
redirApp.get('*',function(req,res){
  res.redirect('https://www.tfletch.tech:8080'+req.url);
});

app.use(parser.json());

function drawData(e){
  console.log(e);
  ctx.beginPath();
  ctx.fillStyle = e.c;
  ctx.fillRect(e.x-e.s/2,e.y-e.s/2,e.s,e.s);
  ctx.closePath();
}

// ********** API CALLS ***************
app.get('/',function(req,res){
  res.sendFile(__dirname+"/draw.html");
});

app.get('/source',function(req,res){
  res.sendFile(__dirname+"/draw.js");
});

// ********* Socket handlers **********
io.on('connection', function(socket){

  socket.on('draw', function(data){
    console.log("Transmitting " + Object.keys(data).length + " bytes" );
    var data = JSON.parse(data);
    for(var key in data){
      drawData(data[key]);
    }
    io.emit('receive',JSON.stringify(data));
  });

  socket.on('getCanvas',function(reason){
    console.log("Sending canvas");
    if(reason == "Load"){
      socket.emit('setCanvas', canvas.toDataURL());
    }else{
      socket.emit('downloadCanvas', canvas.toDataURL());
    }
  });
});

