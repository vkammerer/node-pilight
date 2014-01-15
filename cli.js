var fs = require('fs'),
	Q =  require('q'),
	pilight = require('./pilight'),
	cliArgs = {};

var qLights = Q.defer();

fs.readFile('./protocols/everflourish-EMWT200T_EMW201R.json', function (err, data) {
	if (err) throw err;
	qLights.resolve(JSON.parse(data));
});

process.argv.forEach(function (val, index, array) {
	if (val.match(/^ref:/)) {
		cliArgs.ref = val.substring(4)
	}
	else if (val.match(/^status:/)) {
		cliArgs.status = val.substring(7)
	}
});

qLights.promise.then(function (lights){
	if (lights[cliArgs.ref][cliArgs.status]) {
		pilight.sendRaw(lights[cliArgs.ref][cliArgs.status]);
	}
},function (reason) {
	console.log('Lights configuration file not read: ' + reason)
});
