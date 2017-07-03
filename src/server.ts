#!/usr/bin/node

// *********** OBJECT INITIALIZATION ************
var fs = require('fs');
var path = require('path');
var opts = {
  key: fs.readFileSync("/home/master/certs/tfletch_tech.key"),
  cert: fs.readFileSync("/home/master/certs/tfletch_tech.crt")
};
var app = require('express')();
var https = require('https').createServer(opts,app);
var server = require('socket.io')(https, {'transports': ['websocket', 'polling']});
var redirApp = require('express')();
var redirHttp = require('http').createServer(redirApp);
var parser = require('body-parser');
var Canvas = require('canvas');

// ********* SETUP *********
https.listen(443, function(){
  console.log('Server started. Listening on port 443');
});

// Redirect all traffic to https
redirHttp.listen(80);
redirApp.get('*',function(req,res){
  res.redirect('https://www.tfletch.tech'+req.url);
});

app.use(parser.json());

function drawData(ctx, e){
  ctx.beginPath();
  ctx.fillStyle = e.c;
  ctx.fillRect(e.x-e.s/2,e.y-e.s/2,e.s,e.s);
  ctx.closePath();
}

class Room {
  canvas:HTMLCanvasElement;
  name:string;
  members:any[];
  ctx:CanvasRenderingContext2D;

  constructor(name:string, sizeX:number, sizeY:number){
    this.name = name;
    this.canvas = new Canvas(sizeX,sizeY);
    this.ctx = this.canvas.getContext('2d');
  }

  addMember(client:Client):void{
    
  } 
}

class Client {
  socket:any;
  room:Room;

  constructor(socket:any){
    this.socket = socket;
  }
  
  setRoom(room:Room):void {
    this.room = room;
  }

  getRoom():Room {
    return this.room;
  }

  getRoomName():string {
    return this.room.name;
  }
}

let room:Room = new Room("Root", 1000, 1000);

console.log(__dirname);

// ********** ENDPOINTS ***************
app.get('/',function(req,res){
  res.sendFile(path.resolve(__dirname+"/../html/draw.html"));
});

app.get('/source',function(req,res){
  res.sendFile(path.resolve(__dirname+"/../js/draw.js"));
});

app.get('/client.js',function(req,res){
  res.sendFile(path.resolve(__dirname+"/../js/client.js"));
});

// ********* Socket handlers **********
server.on('connection', function(socket){
  let client = new Client(socket);
  console.log(socket);
  socket.on('draw', function(data){
    var data = JSON.parse(data);
    for(var key in data){
      drawData(room.ctx, data[key]);
    }
    server.emit('receive',JSON.stringify(data));
  });

  socket.on('getCanvas',function(reason){
    console.log("Sending canvas");
    if(reason == "Load"){
      socket.emit('setCanvas', room.canvas.toDataURL());
    }else{
      socket.emit('downloadCanvas', room.canvas.toDataURL());
    }
  });
});

