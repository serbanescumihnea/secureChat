var express = require('express')
var app = express()
const path = require('path');
const router = express.Router();
var bodyParser = require("body-parser");
var cookie = require("cookie");
const { nextTick } = require('process');
var cookieParser = require('cookie-parser');
const rateLimit = require("express-rate-limit");
var xss = require("xss");

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

//WEBSOCKET SERVER
const WebSocket=require('ws');
const { json } = require('express');
const { parse, join } = require('path');
const wss = new WebSocket.Server({port:4001});






//ROOMS
var rooms = [];
var clientsWS = [];

const joinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:30,
    message: "Too many join/create requests created from this IP, please try again later."
});


wss.on('connection',function connection(ws){
    ws.on('message',function incoming(message){
       
        var parsedMessage = JSON.parse(message);
        if(parsedMessage.method==="join"){
            if(JSON.parse(rooms[parsedMessage.roomID]).password===parsedMessage.roomPassword){
                var found = false;
                
                var x = JSON.parse(rooms[parsedMessage.roomID]);
                for(var i=0;i<x.clients.length;i++){
                    if(parsedMessage.client==x.clients[i]){
                        found = true;
                    }
                }
                if(found==false){
                x.clients.push(parsedMessage.client);
                x.clientsWebSockets.push(ws);
                rooms[parsedMessage.roomID] = JSON.stringify(x);
                }
                payload = {
                    "method":"addUser",
                    "users": x.clients
                }
                clientsWS[parsedMessage.client] = ws;
                ws.send(JSON.stringify(payload));
                for(var i=0;i<x.clients.length;i++){
                    if(x.clients[i]!=parsedMessage.client){
                        var wsAux = clientsWS[x.clients[i]];
                        wsAux.send(JSON.stringify(payload));
                    }
                }
            
            }
        }
        else if(parsedMessage.method==="sendMsg"){
            
            if(JSON.parse(rooms[parsedMessage.roomId]).password === parsedMessage.roomPassword){
            payload={
                "method":"receivedMessage",
                "message":parsedMessage.message,
                "sender":parsedMessage.sender
            }
            for(var i = 0;i<JSON.parse(rooms[parsedMessage.roomId]).clients.length;i++){
                clientsWS[JSON.parse(rooms[parsedMessage.roomId]).clients[i]].send(JSON.stringify(payload));
       
            }
        }
        }
        
    });
});








router.get('/', function(req,res){
    res.sendFile(path.join(__dirname+'/home.html'));

});
router.get('/join', function(req,res){
    res.sendFile(path.join(__dirname+'/join.html'));    

});





router.post('/create-user', function(req,res){
    req.body.username = xss(req.body.username);
    
    res.setHeader('Set-Cookie', cookie.serialize('username',req.body.username, {
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        encode: v=>v
      }));
    res.redirect('/join');
})





router.post('/create-room',joinLimiter, function(req,res){
    if(xss(req.body.roomID)==req.body.roomID){
    if(!rooms[req.body.roomID]){
        
        payload = {
            "password":req.body.Password,
            "clients": [],
            "clientsWebSockets":[]
        }
        rooms[req.body.roomID] = JSON.stringify(payload);
        res.redirect('/room'+"?id="+req.body.roomID+"&&password="+req.body.Password);
    }else{
        res.json({error:"Room id is already used, try something else!"});
    }
}else{
    res.json({error:"Special characters are not allowed when creating a new room!"});
}
   
})
router.post('/join-room',joinLimiter, function(req,res){
     res.redirect('/room'+"?id="+req.body.roomID+"&&password="+req.body.Password);
})







router.get('/room', function(req,res){
    if(req.cookies['username']){
        try { 
        var x = JSON.parse(rooms[req.query.id]);
        if(x.password === req.query.password){
            res.sendFile(path.join(__dirname+'/room.html'));    
            res.cookie('id',req.query.id,{maxAge:900000,httpOnly:false});
            res.cookie('password',req.query.password,{maxAge:900000,httpOnly:false});
        }else{
            res.send("INCORRECT ROOM CREDENTIALS");
        }
    }catch(error){
        res.send("INCORRECT ROOM ID");
    }
    }
});



function checkWebSockets(){
    
    Object.keys(rooms).forEach(room =>{
   
        
        var roomJSON = JSON.parse(rooms[room]);
        var clientAux;
        if(roomJSON!=null){
        var isAlive = false;

        
        roomJSON.clients.forEach(client =>{
            clientAux = client;
            if(clientsWS[client]){
            if(clientsWS[client].readyState === clientsWS[client].OPEN){
                isAlive = true;
                
            }
          
        }
        });
        if(isAlive == false){
            
            if(clientsWS[clientAux]){
            clientsWS[clientAux] = null;
            }
            rooms[room] = null;
        }
    }
    });
    setTimeout(checkWebSockets, 1800000); // 1800000ms
}

setTimeout(checkWebSockets, 1800000); // 1800000ms

/*
function checkUsedMemory(){
    var used = process.memoryUsage().heapUsed / 1024 / 1024;

setTimeout(checkUsedMemory,3000);
}

setTimeout(checkUsedMemory,3000);
*/

















app.use(express.static('public'));

app.use('/',router);
app.listen(process.env.port || 3000);

console.log("server running -> localhost:3000");
