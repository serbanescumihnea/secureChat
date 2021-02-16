const connection = new WebSocket('ws://localhost:4001/room');


var userList,messageInput,messagesUl,buttonInput;



function addUser(users){
    

    for(var i=0;i<users.length;i++){
        if(users[i]!=connection.username){
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(users[i]));
    li.className = "list-group-item ";
    li.style = "margin-top:50%;"
    userList.appendChild(li);
        }
    }
}

function sendMessage(){
    payload={
        "method":"sendMsg",
        "message":CryptoJS.AES.encrypt(messageInput.value,connection.password).toString(),
        "sender":connection.username,
        "roomId":connection.id,
        "roomPassword":connection.password
    }
    connection.send(JSON.stringify(payload));
    messageInput.value = "";
}

function receiveMessage(messageFromServer){
    if(messageFromServer.sender===connection.username){
        messageFromServer.message = CryptoJS.AES.decrypt(messageFromServer.message,connection.password);
        messageFromServer.message = messageFromServer.message.toString(CryptoJS.enc.Utf8);
        var current = new Date();
        var li = document.createElement('li');
        li.className="list-group-item";
        li.id = "sent";
        var p1 = document.createElement('p');
        p1.style="font-size:20px;";
        p1.innerHTML = messageFromServer.message;
        li.appendChild(p1);
        var p2 = document.createElement('p');
        p2.id = "message-paragraph2";
        p2.innerHTML = messageFromServer.sender + " - " + current.toLocaleTimeString();
        messagesUl.appendChild(li);
        messagesUl.appendChild(p2);
        console.log( "rendering 1 " + connection.username);
    }else{
        messageFromServer.message = CryptoJS.AES.decrypt(messageFromServer.message,connection.password);
        messageFromServer.message = messageFromServer.message.toString(CryptoJS.enc.Utf8);
        var current = new Date();
        var li = document.createElement('li');
        li.className="list-group-item";
        li.id = "received";
        var p1 = document.createElement('p');
        p1.style="font-size:20px;";
        p1.innerHTML = messageFromServer.message;
        li.appendChild(p1);
        var p2 = document.createElement('p');
        p2.id = "message-paragraph";
        p2.innerHTML = messageFromServer.sender + " - " + current.toLocaleTimeString();
        messagesUl.appendChild(li);
        messagesUl.appendChild(p2);
        console.log( "rendering 1 " + connection.username);
    }
}



connection.onmessage=e=>{
        var parsedMessageE = JSON.parse(e.data);
        if(parsedMessageE.method==="addUser"){
            addUser(parsedMessageE.users);
        }else if(parsedMessageE.method==="receivedMessage"){
            receiveMessage(parsedMessageE);
        }
}

connection.onopen=function(){
    payload={
        "method":"join",
        "client": connection.username,
        "roomID":connection.id,
        "roomPassword":connection.password
    }
    connection.send(JSON.stringify(payload));
}


// GET JAVASCRIPT VARIABLES

window.onload = (event) =>{
    userList = document.getElementById("MEMBERSLIST");
    console.log(userList);
    messageInput = document.getElementById("textInput");
    messagesUl = document.getElementById("messagesUl");
    buttonInput = document.getElementById('buttonInput');
    messageInput.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            sendMessage();
            messageInput.value = "";
        }
    });
};





//GETCOOKIES
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
connection.username = getCookie('username');
connection.id = getCookie('id');
connection.password = getCookie('password');