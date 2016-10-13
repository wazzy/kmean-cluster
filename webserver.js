var serverIp = "localhost", serverPort = 8544;

var http = require("http"),
send = require('send'),
url = require('url'),
_ = require('underscore');

var Gearman = require("node-gearman");
var gearman_client = new Gearman("localhost", 4730);

//App core
var app = http.createServer(function(req, res) {
    
    //Http Error Handler
    function error(err) {
        res.statusCode = err.status || 500;
        res.setHeader('Content-Type', 'text/html');
        res.end("<span style='font: 15px Tahoma; color: red'>Error: </span><span'>Page not Found! <br>Click <a href='http://"+serverIp+":"+serverPort+"''>here</a> to go to Home Page...</span></span>");
    }

    //Http Redirect Handler
    function redirect() {
        res.statusCode = 301;
        res.setHeader('Location', req.url + '/');
        res.end('Redirecting to ' + req.url + '/');
    }

    //Http Root
    function setRoot(){ 
        res.setHeader("Access-Control-Allow-Origin", "*");
        return './';
    }

    //Http Set Index
    function setIndex(){
        res.setHeader("Access-Control-Allow-Origin", "*");
        return './index.html';
    }

    var path = url.parse(req.url).pathname;
    if( path == "/get_data") {
	//AJAX CALL
	
    } else {
	//Http Return Pipe
	send(req, url.parse(req.url).pathname, {root: setRoot(), index: setIndex()})
	    .on('error', error)
	    .on('directory', redirect)
	    .pipe(res);
    }

}).listen(serverPort);

var printConnection = function(username, socket_id) {
    console.log("===== --- ===== --- UPDATE ===== --- ===== --- =====");
    console.log("CON : " + username + "(" + socket_id + ")");
    console.log("===== --- ===== ---        ===== --- ===== --- =====\n");
};

var checkAuthToken = function(token, callback){
    authenticate_this = true;
    return callback(null, authenticate_this);
};

//Socket Handler
io = require('socket.io').listen(app).sockets.on('connection', function (socket) {
    socket.auth = false;
    //check the auth data sent by the client
    socket.on('authenticate', function(data){
        checkAuthToken(data.token, function(err, success){
            if (!err && success){
                console.log("Authenticated socket ", socket.id);
                socket.auth = true;
                _.each(io.nsps, function(nsp) {
                    if(_.findWhere(nsp.sockets, {id: socket.id})) {
                        console.log("restoring socket to", nsp.name);
                        nsp.connected[socket.id] = socket;
                    }
                });
                printConnection(data.token, socket.id);
                io.to(socket.id).emit('ur_id', {"connected": data.token, "conId": socket.id});
                socket.broadcast.emit('cli_connected', {"connected": data.token, "conId": socket.id});
            }
        });
        console.log("authenticate - " , socket.id);
    });

    //If the socket didn't authenticate, disconnect it
    setTimeout(function(){
        if (!socket.auth) {
            console.log("Disconnecting socket ", socket.id);
            socket.disconnect('unauthorized', stats);
        }
    }, 1000);

    //Welcome Event
    socket.on('welcome', function (data) {
        var dataToSend = data;
	dataToSend.type = "connect";
	callSkillsAlfaWorker(JSON.stringify(dataToSend), true);
    });

    //Disconnect Event
    socket.on('disconnect', function() {
        console.log("Disconnect - " , socket.id);
    });

    //Message Event
    socket.on('message', function (data) {
	
    });
 
    //Bot Message Event
    socket.on('botmessage', function (data) {
	io.to(data.toId).emit('resp_message', data);
    });
});