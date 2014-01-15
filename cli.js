var fs = require('fs'),
	Q =  require('q'),
	pilight = require('./pilight'),
	cliArgs = {};

var qLights = Q.defer();

var myProtocolFilePath = './protocols/everflourish-EMWT200T_EMW201R.json';

var gpioSender = pilight.getSender();

fs.readFile(myProtocolFilePath, function (err, data) {
	if (err) throw err;
	qLights.resolve(JSON.parse(data));
});

/*
	Get CLI arguments (ref and status) and store them in cliArgs.
*/
process.argv.forEach(function (val, index, array) {
	if (val.match(/^pin:/)) {
		cliArgs.pin = val.substring(4)
	}
	if (val.match(/^ref:/)) {
		cliArgs.ref = val.substring(4)
	}
	else if (val.match(/^status:/)) {
		cliArgs.status = val.substring(7)
	}
});

/*
	Send raw output
*/
qLights.promise.then(function (lights){
	if (lights[cliArgs.ref][cliArgs.status]) {
		if (gpioSender !== cliArgs.pin) {
			pilight.setSender(cliArgs.pin).then(function(){
				gpioSender = cliArgs.pin;
				pilight.serviceRestart().then(function(){
					pilight.sendRaw(lights[cliArgs.ref][cliArgs.status]);
				})
			})
		}
		else {
			pilight.sendRaw(lights[cliArgs.ref][cliArgs.status]);
		}
	}
},function (reason) {
	console.log('Lights configuration file not read: ' + reason)
});
