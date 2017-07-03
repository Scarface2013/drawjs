#!/usr/bin/node
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var mysql = require('mysql');

var people = {};
var peepCount = 0;
var password = "testPass";

function nameExtract(peoples){
  var toRet = "";
  for(var person in peoples){
    if(peoples.hasOwnProperty(person)){
      toRet += peoples[person].perm == "admin" ? "[A] " : "";
      toRet += peoples[person].perm == "" ? "[X] " : "";
      toRet += peoples[person].name + "  ";
      toRet += person + "\n";
    }
  }
  return toRet;
}

var commands = {

  help: {
    descr: "This menu",
    execute: function(socket){
      for(var key in commands){
        socket.emit('update', "/" + key + ": " + commands[key]["descr"]);
      }
    }
  },

  whisper: {
    descr: "Send a personal message",
    execute: function(socket, args){
      name = args[1];
      args.splice(0,2);
      msg = args.join(' ');
      for(var person in people){
        if(people[person].name == name){
          people[person].socket.emit('whisper',"From "+people[socket.id].name +
            ": "+ msg)
          people[socket.id].socket.emit('whisper',"To "+people[person].name +
            ": "+ msg)
        }
      }
    }
  },

  list: {
    descr: "View Current Room Occupants", 
    execute: function(socket){
      socket.emit('update', "Currently in this room: \n" + nameExtract(people));
    }
  },

  auth: {
    descr:"Authenticates you as admin, and gives you access to administrative commands",
    execute: function(socket,args){
      var msg = args[1]; // Grabs message args
      if(msg == password){
        people[socket.id].perm = "admin";
        socket.emit('update', "You have been successfully authenticated");
      }else{
        socket.emit('warning', "Invalid password"); 
      }
    }
  },
  kick: {
    descr: "Kicks user",
    execute: function(socket,args){
      var msg = args[1]; 
      if(people[msg] && people[socket.id].perm =="admin"){
        people[msg].perm = "";
        socket.emit('update', msg + " kicked");
      }else{
        socket.emit('update', msg + " is not a valid user");
      }
    }
  },
  name: {
    descr: "Change your display name",
    execute:  function(socket,args){
      var msg = args[1];
      console.log(msg);
      if(msg){
        for(var person in people){
          if(people[person].name == msg){
            socket.emit('warning', "Name already in use");
            return;
          }
        }
        socket.emit('update', "You have successfully changed your name to " + msg);
        console.log(people[socket.id].name + "(" + socket.id + ") has changed their name to " + msg);
        people[socket.id].name = msg;
      }else{
        socket.emit('warning', "Invalid name");
      }
    }
  }

}

var con = mysql.createConnection({
  host: 'localhost',
  user: 'nobody',
  database: 'steam_log',
  password: ''
});

con.connect(function(err){
  if(err){
    console.log("Error connecting to MySQL")
    return;
  }
  console.log("MySQL connection established");
});

app.get('/', function(req,res){
  res.sendFile(__dirname + '/chat/chat.html');
});

io.on('connection', function(socket){
  console.log('A user has connected to chat');
  people[socket.id] = { //Defaults:
                        name: "Anon"+peepCount++, 
                        perm: "user",
                        socket: socket 
                      };
  socket.emit('update', "Welcome to the tfletch.tech chatroom! For a list of commands, type '/help'");
  if(peepCount == 1){
    socket.emit('update', "You are the first user! The password is: " + password);
  }
  socket.on('disconnect',function(){
    console.log('user disconnected');
    delete people[socket.id];
  });
  socket.on('chat message', function(msg){
    msg = msg.trim();
    
    if(msg.length > 1000){
      people[socket.id].perm="";
      return;
    }
    
    if(people[socket.id].perm == ""){return;}
    if(msg.charAt(0) == '/'){ //A command is being sent
      command = msg.split(' ')[0].substring(1) || msg.substring(1); 
      arg = msg.split(' ') || null;
      if(commands.hasOwnProperty(command)){
        commands[command]["execute"](socket,arg);
      }else{ //An invalid command is being sent
        socket.emit('warning', command + " is not a valid command");
      }
    }else if(msg.length >= 1){ //A chat message is being sent
      io.emit('chat message', people[socket.id].name+": "+msg);
      console.log(people[socket.id].name+": "+msg);
      con.query('INSERT INTO chatlog SET ?',
        {alias: people[socket.id].name,
         message: msg,
         ip: socket.request.connection.remoteAddress.substring(7) //Theres some garbage at the beginning that the substring takes care of
        });
    }else{ //No message detected
      socket.emit('warning', "Message too short");
    }
  });
});

http.listen(8080, function(){
  console.log('Server started. Listening on port 8080');
});
