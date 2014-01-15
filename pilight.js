var exec = require('child_process').exec,
	fs = require('fs'),
	Q = require('q');

var _self = this;

var settingsPath = '/etc/pilight/settings.json';

var wiringPiGpios = {
	17: 0,
	18: 1,
	22: 3,
	23: 4,
	24: 5,
	25: 6,
	4: 7
}

exports.getSender = function(){
	var wiringPiSender = JSON.parse(fs.readFileSync(settingsPath))["gpio-sender"];
	for (var i in wiringPiGpios) {
		if (wiringPiGpios[i] === wiringPiSender) {
			return i;
		}
	}
	return;
}

exports.setSender = function(sender){
	var thisDefer = Q.defer();
	fs.readFile(settingsPath, function (err, data) {
		if (err) throw err;
		var settings = JSON.parse(data);
		settings["gpio-sender"] = wiringPiGpios[sender];
		fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), function(err) {
			if (err) throw err;
			thisDefer.resolve();
		});
	});
	return thisDefer.promise;
}

exports.serviceStop = function(){
	console.log('serviceStop 0')
	var thisDefer = Q.defer();
	exec('sudo service pilight stop',
	function (error, stdout, stderr) {
		console.log('serviceStop 1')
		if (error !== null) {
			console.log('exec error: ' + error);
    }
    else {
			console.log('serviceStop 2')
			thisDefer.resolve();
    }
	});		
	return thisDefer.promise;
}

exports.serviceStart = function(){
	console.log('serviceStart 0')
	var thisDefer = Q.defer();
	exec('sudo service pilight start',
	function (error, stdout, stderr) {
		console.log('serviceStart 1')
		if (error !== null) {
			console.log('exec error: ' + error);
    }
    else {
			console.log('serviceStart 2')
			thisDefer.resolve();		
    }
	});
	return thisDefer.promise;
}

exports.serviceRestart = function(){
	var thisDefer = Q.defer();
	console.log('serviceRestart 0')
	_self.serviceStop().then(function(){
		console.log('serviceRestart 1')
		setTimeout(function(){
			console.log('serviceRestart 2')
			_self.serviceStart().then(function(){
				console.log('serviceRestart 3')
				setTimeout(function(){
					console.log('serviceRestart 4')
					thisDefer.resolve();
				}, 5000);
			})
		}, 5000);
	})
	return thisDefer.promise;
}

exports.sendRaw = function(command){
	if (command) {
		exec('sudo pilight-send -p raw -c "' + command + '"',
		function (error, stdout, stderr) {
			if (error !== null) {
				console.log('exec error: ' + error);
		    }
		});		
	}
}