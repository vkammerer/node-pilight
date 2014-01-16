var spawn = require('child_process').spawn,
	fs = require('fs'),
	Q = require('q');

var _self = this;

var settingsPath = '/etc/pilight/settings.json';

var wiringpiIndexes = {
	17: 0,
	18: 1,
	22: 3,
	23: 4,
	24: 5,
	25: 6,
	4: 7
}

var ojectReverse = function(vkobject, vkvalue){
	for (var i in vkobject) {
		if (vkobject[i] === vkvalue) {
			return i;
		}
	}
}

exports.getSender = function(){
	var wiringpiSender = JSON.parse(fs.readFileSync(settingsPath))["gpio-sender"];
	var gpioIndex = ojectReverse(wiringpiIndexes, wiringpiSender)
	console.log('Current pin for "gpio-sender" is: ' + gpioIndex);
	return gpioIndex;
}

exports.setSender = function(sender){
	var thisDefer = Q.defer();
	fs.readFile(settingsPath, function (err, data) {
		if (err) throw err;
		var settings = JSON.parse(data);
		settings['gpio-sender'] = wiringpiIndexes[sender];
		fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), function(err) {
			if (err) throw err;
			console.log('Set pin for "gpio-sender" as: ' + sender);
			thisDefer.resolve();
		});
	});
	return thisDefer.promise;
}

exports.serviceStop = function(){
	var thisDefer = Q.defer();
	var thisSpawn = spawn('service', ['pilight', 'stop'] );
	thisSpawn.stdout.on('data', function (data) {
//	  console.log('spawn stdout: ' + data);
	});
	thisSpawn.stderr.on('data', function (data) {
	  console.log('spawn stderr: ' + data);
		thisDefer.reject();			
	});
	thisSpawn.on('close', function (code) {
//	  console.log('spawn close - code: ' + code);
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
//	  console.log('spawn stdout: ' + data);
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
//	  console.log('spawn close - code: ' + code);
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
		console.log('pilight sending raw: ' + raw);
		spawn('pilight-send', ['-p', 'raw', '-c', raw] );
	}
}