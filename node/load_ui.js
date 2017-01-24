var process = require('child_process');

exports.loadScreen = function(targetFile) {
	console.log("loadScreen to %s", targetFile);
	process.execFileSync(__dirname + '/bash/load_screen.sh', [targetFile]);	
}

exports.loadViewTree = function(targetFile){
	console.log("loadViewTree to %s", targetFile); 
	var tree = process.execFileSync(__dirname + '/bash/load_view_tree.sh', [targetFile]);
	
}
