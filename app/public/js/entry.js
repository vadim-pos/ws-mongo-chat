'use strict';

let handlebars = require('handlebars');
let socket = io.connect('http://localhost:8080');

// ------------ DOM Nodes ------------

let authSection      = document.querySelector('.auth'),

	formSelect     = authSection.querySelector('.auth__form-select'),
	regFormLink    = authSection.querySelector('.auth__reg-form-link'),
	signInFormLink = authSection.querySelector('.auth__sign-form-link'),

	regFormWrap     = authSection.querySelector('.auth__reg-form'),
	regForm         = document.forms['reg-form'],
	signInFormWrap  = authSection.querySelector('.auth__signin-form'),
	signInForm      = document.forms['signin-form'],
	messageFormWrap = document.querySelector('.message__form'),
	messageForm     = document.forms['message-form'],

	imageBox        = regForm.querySelector('.auth__image-box'),
	imageInput      = imageBox.querySelector('.auth__image-input'),
	imageInputLabel = imageBox.querySelector('.auth__image-label'),
	imageMessage    = imageBox.querySelector('.auth__image-message'),

	messagesContainer = document.querySelector('.messages'),
	messagesList      = messagesContainer.querySelector('.messages__list'),
	messageTemplate   = document.querySelector('#message-template'),

	infoSection = document.querySelector('.info'),

	userInfoNode = infoSection.querySelector('.info__user'),
	userName     = userInfoNode.querySelector('.info__user-name'),
	userImage    = userInfoNode.querySelector('.info__user-img'),

	membersInfoNode = infoSection.querySelector('.info__members'),
	membersCount    = membersInfoNode.querySelector('.info__members-count'),
	membersList     = membersInfoNode.querySelector('.info__members-list');

// ------------ Authorization Message Service ------------

let authMessage = {
	messageNode: authSection.querySelector('.auth__message'),
	isShown: false,

	error(msg) {
		this.messageNode.textContent = 'Error: ' + msg;
		this.messageNode.className = 'auth__message auth__message--error';
		this.messageNode.style.display = 'block';
		this.isShown = true;
	},
	info(msg) {
		this.messageNode.textContent = msg;
		this.messageNode.className = 'auth__message auth__message--info';
		this.messageNode.style.display = 'block';
		this.isShown = true;
	},
	hide() {
		this.messageNode.style.display = 'none';
		this.isShown = false;
	}
};

// ------------ Image Drag'n'Drop ------------

let uploadedImage = null;

addMultipleListeners(imageBox, 'drag dragstart dragend dragover dragenter dragleave drop', e => {
	e.preventDefault();
    e.stopPropagation();
});
addMultipleListeners(imageBox, 'dragover dragenter', () => {
	imageBox.classList.add('auth__image-box--dragover');
});
addMultipleListeners(imageBox, 'dragleave dragend drop', () => {
	imageBox.classList.remove('auth__image-box--dragover');
});
imageBox.addEventListener('drop', imageUploadHandler);
imageInput.addEventListener('change', imageUploadHandler);

function imageUploadHandler(e) {
	if (uploadedImage) { return; }

	let file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
	let imageType = /^image\//;

	if (!imageType.test(file.type)) {
		authMessage.error('Uploaded file is not an image file');
		return;
	}

	if (authMessage.isShown) { authMessage.hide(); }
	uploadedImage = file;

	imageBox.classList.add('auth__image-box--loaded');
	imageInputLabel.style.display = 'none';
	imageMessage.textContent = uploadedImage.name;
}

// ------------ Form selection ------------

formSelect.addEventListener('click', e => {
	e.preventDefault();

	if (e.target === regFormLink) {
		regFormLink.classList.add('auth__form-link--active');
		signInFormLink.classList.remove('auth__form-link--active');
		signInFormWrap.style.display = 'none';
		regFormWrap.style.display = 'block';
	}
	if (e.target === signInFormLink) {
		signInFormLink.classList.add('auth__form-link--active');
		regFormLink.classList.remove('auth__form-link--active');
		regFormWrap.style.display = 'none';
		signInFormWrap.style.display = 'block';
	}
});

// ------------ Form submissions ------------

regForm.addEventListener('submit', e => {
	e.preventDefault();

	socket.emit('registration', {
		name: regForm.name.value,
		nickname: regForm.nickname.value,
		password: regForm.password.value,
		image: uploadedImage || null,
		imageFormat: uploadedImage ? uploadedImage.name.substring(uploadedImage.name.lastIndexOf('.')) : null
	});
});

signInForm.addEventListener('submit', e => {
	e.preventDefault();

	socket.emit('sign-in', {
		nickname: signInForm.nickname.value,
		password: signInForm.password.value
	});
});

messageForm.addEventListener('submit', e => {
	e.preventDefault();

	let message = messageForm.message.value;
	if (message === '') { return; }
	messageForm.message.value = '';

	socket.emit('new-message', {message});
});

// ------------ Receiving messages from server ------------

socket.on('authorization', authorization);

socket.on('user-joins', data => {
	let membersItem = '<li class="info__members-item">' + data.name + '</li>';
	membersList.insertAdjacentHTML('beforeend', membersItem);
	membersCount.textContent = data.usersCount;
});

socket.on('user-leaves', data => {
	for (var i = 0; i < membersList.children.length; i++) {
		if (membersList.children[i].textContent === data.userName) {
			membersList.removeChild(membersList.children[i]);
		}
	}
	membersCount.textContent = data.usersCount;
});

socket.on('new-message', data => {
	let templateSrc = messageTemplate.innerHTML,
		templateFunc = handlebars.compile(templateSrc);
	messagesList.insertAdjacentHTML('beforeEnd', templateFunc(data));
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// ------------ Helpers ------------

function addMultipleListeners(elem, eventsString, callback) {
	eventsString.split(' ').forEach(e => elem.addEventListener(e, callback, false));
}

function authorization(data) {

	if (data.error) { return authMessage.error(data.error); }

	let fragment = document.createDocumentFragment();

	userName.textContent = data.name;
	userImage.setAttribute('src', data.imageUrl);

	authSection.style.display = 'none';
	userInfoNode.previousElementSibling.style.display = 'none';
	userInfoNode.style.display = 'block';

	data.connectedUsers.forEach(user => {
		let membersItem = document.createElement('li');
		membersItem.classList.add('info__members-item');
		membersItem.textContent = user.name;
		fragment.appendChild(membersItem);
	});

	membersList.innerHTML = '';
	membersList.appendChild(fragment);
	membersCount.textContent = data.connectedUsers.length;
	membersInfoNode.style.display = 'block';

	messageFormWrap.style.display = 'block';
}