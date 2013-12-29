var exec = require('child_process').exec;

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