// Module dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var http = require('http');
var fs = require('fs');
var app = express();
var exphbs  = require('express3-handlebars');

// Setup Express
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// Tell Express to use Handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Start Express
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Start Socket.io
var io = require('socket.io').listen(server);

// Handle request
app.get('/', function(req, res){
	res.render('index');
});

// Object containing all users locations
var currentLocations = {};

// On connection...
io.on('connection', function(socket){
	var clients = io.sockets.clients();
	// send how many users online
	io.sockets.emit('usersOnline', {online:clients.length});

	// listen for mouse updates from client
	socket.on('mouse', function (name, fn) {

		// store users location in local var
		currentLocations[socket.id] =  {
			"id": socket.id,
			"x": name.x,
			"y": name.y,
		};

		// broadcast mouse updates to other connected users
		socket.broadcast.emit('drawFriend', {
			"id": socket.id,
			"x": name.x,
			"y": name.y,
			"clickme": name.clickme
		});
	});
	
	socket.on('disconnect', function(){
		// Every disconnect send updated users online
		var clients = io.sockets.clients();
		io.sockets.emit('usersOnline', {online: clients.length});
		// remove users location in local var
		delete currentLocations[socket.id];

		// remove user from clients
		io.sockets.emit('deleteUser', socket.id);
	});

	socket.emit('init',currentLocations);
});