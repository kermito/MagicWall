const electronInstaller = require('electron-winstaller');
try {
    electronInstaller.createWindowsInstaller({
        appDirectory: './',
        outputDirectory: './installer',
        authors: 'Arnaud Triolet.',
        exe: 'magicwall.exe'
    });

    console.log('It worked!');
} catch (e) {
    console.log(`No dice: ${e.message}`);
}