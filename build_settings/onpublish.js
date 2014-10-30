require('fs');
var exec = require('child_process').exec;

from_path = '/dri/driapp/build_settings/machine_name.txt';
to_path = '/dri/machine_name.txt';

function copyFromTo(fromPath, toPath) {
        var cmd = 'cp ' + fromPath + ' ' + toPath;
        console.log("copyFromTo running command: " + cmd);
        exec(cmd, function(err, stdout, stderr) {
                console.log('STDOUT = ' + stdout);
                console.log('STERR = ' + stderr);
        });
}



copyFromTo(from_path, to_path);
