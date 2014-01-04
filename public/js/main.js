var locationData = {touches:[]};
var mouseX = 0, mouseY = 0;
var lmouseX = 0, lmouseY = 0;
var socket = io.connect();
var friendIds = {};
var $follower = $("#follower");
var xp = 0, yp = 0;

$(document).mousemove(function(e){
   mouseX = e.pageX;
   mouseY = e.pageY;
   normalize(locationData, mouseX, mouseY);
});

$(document).mousedown(function(e){
   mouseX = e.pageX;
   mouseY = e.pageY;
   normalize(locationData, mouseX, mouseY);
   drawExplosion({x:xp, y:yp});
   socket.emit('mouse', { x:  xp, y: yp, clickme:1});
});

function normalize(lcd, px, py){
	lcd.touches[0] = (px/lcd.cw-0.5)*3;
	lcd.touches[1] = (py/lcd.ch-0.5)*-2;
}

var loop = setInterval(function(){
    // Dampens mouse movement
    xp += (mouseX - xp) / 5;
    yp += (mouseY - yp) / 5;
    $follower.css({left:xp, top:yp});
    if (Math.round(xp) != Math.round(lmouseX) || Math.round(yp) != Math.round(mouseY)) {
		lmouseY = yp;
		lmouseX = xp;
		socket.emit('mouse', { x:  xp, y: yp});
	}
}, 30);

socket.on('connect', function () {

	//Updates number of users online, emmited from node every time someone connects or disconnects
	socket.on('usersOnline', function (data) {
		$('#usersOnline').text(data.online);
	});

	// Sent on first connect, initial locations of connected users
	socket.on('init', function (data) {
		for (var friendId in data) {
			if (typeof friendIds[friendId]=="undefined") {
				createFriend(data[friendId]);
			}
			updateFriend(data[friendId]);
		}
	});

	// Delete user event
	socket.on('deleteUser', function (friendId) {
		removeFriend(friendId);
	});

	// Sent when remote user moves mouse, contains updated coordiantes and click action
	socket.on('drawFriend', function (data) {
		if (typeof friendIds[data.id]=="undefined") {
			createFriend(data);
		}
		updateFriend(data);
		if (data.clickme) {
			drawExplosion(data);
		}
	});

});

function removeExplosion(id) {
	$('#'+id).fadeOut().remove();
}

function drawExplosion(data) {
	var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
	var uniqid = randLetter + Date.now();
	$div = $('<div id="'+ uniqid +'" class="explosion">BOOOM</div>');
	$div.css({left:data.x, top:data.y});
	setTimeout(function(){
		removeExplosion(uniqid);
	}, 1000);
	$('body').append($div);
}

function createFriend(data) {
	$('body').append('<div id="'+ data.id +'" class="friend"></div>');
	var newLocationData = {touches:[]};
	friendIds[data.id] = newLocationData;
}

function updateFriend(data) {
	$('#' + data.id).css({left:data.x, top:data.y});
	normalize(friendIds[data.id], data.x, data.y);
}

function removeFriend(id) {
	delete friendIds[id];
	$('#' + id).remove();
}