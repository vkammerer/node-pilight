var spawn = require('child_process').spawn,
	fs = require('fs'),
	net = require('net'),
	Q = require('q');

var settingsPath = '/etc/pilight/settings.json';

var wiringpiIndexes = {
	"17": "0",
	"18": "1",
	"22": "3",
	"23": "4",
	"24": "5",
	"25": "6",
	"4": "7"
}

var gpioIndexes = (function(){
	var toReturn = {};
	for (var i in wiringpiIndexes) {
		toReturn[wiringpiIndexes[i]] = i;
	}
	return toReturn;
})();

exports.getSettings = function(){
	var settings = JSON.parse(fs.readFileSync(settingsPath));
	if (settings["gpio-sender"]) {
		settings["gpio-sender"] = gpioIndexes[settings["gpio-sender"]];
	}
	if (settings["gpio-receiver"]) {
		settings["gpio-receiver"] = gpioIndexes[settings["gpio-receiver"]];
	}
	console.log(JSON.stringify(settings))
	return settings;
}

exports.serviceStop = function(){
	var thisDefer = Q.defer();
	var thisSpawn = spawn('service', ['pilight', 'stop'] );
	thisSpawn.stdout.on('data', function (data) {
	});
	thisSpawn.stderr.on('data', function (data) {
	  console.log('spawn stderr: ' + data);
		thisDefer.reject();			
	});
	thisSpawn.on('close', function (code) {
		if (code === 0) {
			console.log('pilight successfully stopped');
			thisDefer.resolve();
		}
		else {
			thisDefer.reject();			
		}
	});
	return thisDefer.promise;
}

exports.serviceStart = function(){
	var thisDefer = Q.defer();
	var thisSpawn = spawn('service', ['pilight', 'start'] );
	thisSpawn.stdout.on('data', function (data) {
	  /*
	  	Fixing pilight: spawn is not "closed"
	  	after successful restart
		*/
		if (data.toString().search(/Starting : pilight/g) >= 0) {
			console.log('pilight successfully started');
			thisDefer.resolve();
		}
		else {
			thisDefer.reject();			
		}
	});
	thisSpawn.stderr.on('data', function (data) {
	  console.log('spawn stderr: ' + data);
		thisDefer.reject();			
	});
	thisSpawn.on('close', function (code) {
	  if (thisDefer.promise.isPending()) {
			if (code === 0) {
				console.log('pilight successfully started');
				thisDefer.resolve();
			}
			else {
				thisDefer.reject();
			}
	  }
	});
	return thisDefer.promise;
}

var _self = this;

exports.serviceRestart = function(){
	var thisDefer = Q.defer();
	_self.serviceStop().then(function(){
		setTimeout(function(){
			_self.serviceStart().then(function(){
				setTimeout(function(){
					console.log('pilight successfully restarted')
					thisDefer.resolve();
				}, 1000);
			})
		}, 1000);
	})
	return thisDefer.promise;
}

exports.sendRaw = function(raw){
	if (raw) {
		var thisDefer = Q.defer();
		console.log('pilight sending raw: ' + raw);

		var thisSocket = new net.Socket();
		thisSocket.connect(5000);

		thisSocket.on('connect', function(data){

			var jsonMessage = JSON.stringify({
				message: "client sender"
			});

			thisSocket.write(jsonMessage, 'utf-8', function(){
				console.log('jsonMessage: client sender sent');


				var lightMessage = JSON.stringify({
				    message: 'send',
				    code: {
							protocol:  [ 'raw' ],
					    code: raw
					  }
				})

				thisSocket.write(lightMessage, 'utf-8', function(){
					console.log('jsonMessage: client sender sent');
					thisDefer.resolve();
				});

			});
		})

		thisSocket.on('data', function(data){

			var dataArray = data.toString().split("\n");

			for (msg in dataArray) {
				if (dataArray[msg].length) {
					var message = JSON.parse(dataArray[msg]);
					console.log(message);
				}
			}
		})

		return thisDefer.promise;
	}
}

exports.receiveData = function(){
	var thisSocket = new net.Socket();
	thisSocket.connect(5000);
	
	thisSocket.on('connect', function(data){

		var jsonMessage = JSON.stringify({
			message: "client receiver"
		});

		thisSocket.write(jsonMessage, 'utf-8', function(){
			console.log('jsonMessage: client receiver sent');
		});
	})

	thisSocket.on('data', function(data){

		var dataArray = data.toString().split("\n");

		for (msg in dataArray) {
			if (dataArray[msg].length) {
				var message = JSON.parse(dataArray[msg]);
				console.log(message);
			}
		}
	})	
}
