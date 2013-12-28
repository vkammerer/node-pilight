var	exec = require('child_process').exec,
	fs = require('fs'),
	Q =  require('q');

var qLights = Q.defer();

fs.readFile('./lights.json', function (err, data) {
	if (err) throw err;
	qLights.resolve(JSON.parse(data));
});		

var getArgs = function(){
	var	toReturn = {};
	process.argv.forEach(function (val, index, array) {
		if (val.match(/^light:/)) {
			toReturn.ref = val.substring(6)
		}
		else if (val.match(/^status:/)) {
			toReturn.status = val.substring(7)
		}
	});
	return toReturn;
}

var args = getArgs();

qLights.promise.then(function (lights) {
	if (lights[args.ref][args.status]) {
		switchLight(lights[args.ref][args.status]);
	}
}, function (reason) {
	console.log('Lights configuration file not read: ' + reason)
});


var switchLight = function(command){
	exec('sudo pilight-send -p raw -c "' + command + '"',
	function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		if (error !== null) {
			console.log('exec error: ' + error);
	    }
	});
}