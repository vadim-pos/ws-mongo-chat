'use strict';

let fs       = require('fs'),
	mongoose = require('mongoose'),
	util     = require('util');

// ----- DB Configuration -----

// Using native ES Promise instead of Mongoose mpromise
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/chatDb');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('Connected to DB'));

let ChatUser = mongoose.model('ChatUser', {
	nickname: String,
	name: String,
	password: String,
	imageUrl: String
});

// ----- Model Object -----

module.exports = {
	
	connectedUsers: [],

	createUserImage(imgData, imgFormat) {
		let imagesDir = __dirname + '/public/img/users/',
			imageName = Date.now() + imgFormat;

		if (!fs.existsSync(imagesDir)) { fs.mkdir(imagesDir); }

		fs.writeFile(imagesDir + imageName, imgData, 'binary', err => {
			if (err) { console.log(err); }
		});
		return imageName;
	},

	createNewUser(userData) {
		let newUser = new ChatUser({
			nickname: userData.nickname,
			name: userData.name,
			password: userData.password,
			imageUrl: 'img/users/' + (userData.image ? this.createUserImage(userData.image, userData.imageFormat) : 'default.jpg')
		});
		this.connectUser(newUser);
		return new Promise((resolve, reject) => {
			newUser.save()
			.then(() => { resolve(newUser); });
		});
	},

	connectUser(user) {
		this.connectedUsers.unshift(user);
	},

	disconnectUser(nickname) {
		this.connectedUsers.splice(this.getConnectedUser(nickname), 1);
	},

	getUserFromDb(nickname) {
		return new Promise((resolve, reject) => {
			ChatUser.findOne({nickname: nickname})
			.then(user => { resolve(user); });
		});
	},

	getConnectedUser(nickname) {
		let connectedUser;
		this.connectedUsers.forEach(user => {
			if (user.nickname === nickname) { return connectedUser = user; }
		});
		return connectedUser;
	}
}