var exec = require('child_process').exec,
		light,
		status;

process.argv.forEach(function (val, index, array) {
	if (val.match(/^light:/)) {
		light = val.substring(6)
	  console.log('Light: ' + light);
	}
	if (val.match(/^status:/)) {
		status = val.substring(7)
	  console.log('Status: ' + status);
	}
});



/*

exec('sudo /home/pi/Development/pilight/pilight',
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});

*/