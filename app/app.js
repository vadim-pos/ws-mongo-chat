'user strict';

let express  = require('express'),
	socketIO = require('socket.io'),
	model    = require(__dirname + '/models/users-model'),
	// server setup
	app = express(),
	server = require('http').Server(app).listen(8080, () => console.log('Running on http://localhost:8080')),
	io = socketIO(server);

// ---------- App Configuration ----------

app.use(express.static(__dirname + '/public'));

// ---------- Routing ----------

app.get('/', (req, res) => {
	res.sendFile('index.html');
});

// ---------- Socket Events ----------

io.on('connection', (socket) => {

	socket.on('registration', data => {
		model.getUserFromDb(data.nickname)
		.then(user => {
			if (user) { return authorization.error(socket, 'This user already exists'); }
			
			model.createNewUser(data)
			.then(newUser => { authorization.success(socket, newUser); })
		});
	});

	socket.on('sign-in', data => {
		model.getUserFromDb(data.nickname)
		.then(user => {
			if (!user || user.password !== data.password) {
				return authorization.error(socket, 'The entries are not correct');
			}
			model.connectUser(user);
			authorization.success(socket, user);
		});
	});

	socket.on('disconnect', () => {
		if (!socket.userId) { return; }

		socket.broadcast.emit('user-leaves', {userName: model.getConnectedUser(socket.userId).name, usersCount: model.connectedUsers.length});
		model.disconnectUser(socket.userId);
	});

	socket.on('new-message', data => {
		let sender  = model.getConnectedUser(socket.userId),
			msgDate = new Date(),
			hours   = msgDate.getHours(),
			mins    = msgDate.getMinutes();
		io.sockets.emit('new-message', {
			userName: sender.name, 
			userImage: sender.imageUrl, 
			message: data.message,
			time: (hours < 9 ? '0' + hours : hours)  + ':' + (mins < 9 ? '0' + mins : mins)
		});
	});
});

// ---------- Helpers ----------

let authorization = {
	success(socket, user) {
		socket.userId = user.nickname;
		socket.emit('authorization', { name: user.name, connectedUsers: model.connectedUsers, imageUrl: user.imageUrl});
		socket.broadcast.emit('user-joins', {name: user.name, usersCount: model.connectedUsers.length});
	},
	error(socket, errMessage) {
		socket.emit('authorization', {error: errMessage});
	}
};