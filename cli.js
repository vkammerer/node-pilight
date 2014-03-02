var fs = require('fs'),
	pilight = require('./pilight'),
	Q = require('q'),
	cliArgs = {};

var everflourishProtocolFilePath = './protocols/everflourish-EMWT200T_EMW201R.json',
	kakuConfigFilePath = './config/kaku.json';

/*
	Get CLI arguments and store them in cliArgs.
*/
process.argv.forEach(function (val, index, array) {
	if (val.match(/^p:/)) {
		cliArgs.protocol = val.substring(2)
	}
	else if (val.match(/^u:/)) {
		cliArgs.unit = parseInt(val.substring(2))
	}
	else if (val.match(/^s:/)) {
		cliArgs.state = val.substring(2)
	}
	else if (val.match(/^d:/)) {
		cliArgs.dimlevel = parseInt(val.substring(2))
	}
});

var qEverflourish = Q.defer();

fs.readFile(everflourishProtocolFilePath, function (err, data) {
	if (err) throw err;
	qEverflourish.resolve(JSON.parse(data));
});

var qKaku = Q.defer();

fs.readFile(kakuConfigFilePath, function (err, data) {
	if (err) throw err;
	qKaku.resolve(JSON.parse(data));
});

Q.all([qEverflourish.promise, qKaku.promise]).spread(
	function (everflourish, kaku){


		var sendEverflourish = function(unit, state){
			var thisDefer = Q.defer();
			var messageContent = {
				message: 'send',
				code: {
					protocol:  [ 'raw' ],
					code: everflourish[unit][state]
				}
			}
			pilight.send(messageContent).then(function(){
				thisDefer.resolve();
			});
			return thisDefer.promise;
		}

		var sendKakuSwitch = function(unit, state){
			var thisDefer = Q.defer();
			var messageContent = {
				message: 'send',
				code: JSON.parse(JSON.stringify(kaku))
			}
			messageContent.code['protocol'] = ['kaku_switch'];
			messageContent.code['unit'] = unit;
			messageContent.code[state] = 1;
			pilight.send(messageContent).then(function(){
				thisDefer.resolve();
			});
			return thisDefer.promise;
		}

		var sendKakuDimmer = function(unit,dimlevel){
			var thisDefer = Q.defer();
			var messageContent = {
				message: 'send',
				code: JSON.parse(JSON.stringify(kaku))
			}
			messageContent.code['protocol'] = ['kaku_dimmer'];
			messageContent.code['unit'] = unit;
			messageContent.code['dimlevel'] = dimlevel;
			pilight.send(messageContent).then(function(){
				thisDefer.resolve();
			});
			return thisDefer.promise;
		}

		if ((cliArgs.protocol == 'everflourish') && everflourish[cliArgs.unit][cliArgs.state]) {
			sendEverflourish(cliArgs.unit, cliArgs.state).then(function(){
				console.log('ok')
				process.exit(0);
			});
		}
		else if (cliArgs.protocol == 'kaku') {
			if (cliArgs.state) {
				sendKakuSwitch(cliArgs.unit, cliArgs.state).then(function(){
					console.log('ok')
					process.exit(0);
				});				
			}
			else if (typeof(cliArgs.dimlevel) !== 'undefined') {
				sendKakuDimmer(cliArgs.unit, cliArgs.dimlevel).then(function(){
					console.log('ok')
					process.exit(0);
				});				
			}
			else {

				var dimmlight = function(dimlevel){
					var thisDefer = Q.defer();
					sendKakuDimmer(1, dimlevel).then(function(){
						console.log('sent level ' + dimlevel);
						thisDefer.resolve();
					});
					return thisDefer.promise;
				}
				var dimmLoop = function(dimlevel, direction) {
					dimlevel = dimlevel + direction;
					dimmlight(dimlevel).then(function(){
						if (dimlevel>12) {
							dimmLoop(dimlevel,-1)
						}
						else if (dimlevel<1) {
							dimmLoop(dimlevel,1)
						}
						else {
							dimmLoop(dimlevel,direction)						
						}
					})
				}

				dimmLoop(0,1);
			}
		}
	},function (reason) {
		console.log('Lights configuration file not read: ' + reason)
	}
);
