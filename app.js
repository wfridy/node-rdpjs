var rdp = require('./lib');

var client = rdp.createClient({ 
	domain : '', 
	userName : 'Administrator',
	password : '1q2w3e$R%T^Y',
	enablePerf : true,
	autoLogin : true,
	decompress : false,
	screen : { width : 800, height : 600 },
	locale : 'en',
	logLevel : 'INFO'
}).on('connect', function () {
  console.log('Connect');
}).on('close', function() {
  console.log('close');
}).on('bitmap', function(bitmap) {

}).on('error', function(err) {
  console.error('Error: ', err)
}).connect('119.29.203.80', 3389);

