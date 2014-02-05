var fs = require('fs'),
	pilight = require('./pilight'),
	cliArgs = {};

var myProtocolFilePath = './protocols/everflourish-EMWT200T_EMW201R.json';

/*
	Get CLI arguments (ref and status) and store them in cliArgs.
*/
process.argv.forEach(function (val, index, array) {
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
pilight.sendRaw(lights[cliArgs.ref][cliArgs.status]);
