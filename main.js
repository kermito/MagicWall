const { app, BrowserWindow, Tray, Menu, powerMonitor } = require('electron');
const path = require('path');
const axios = require('axios');
const { ipcMain } = require('electron');
const wallpaper = require('wallpaper');
const fs = require('fs');
const os = require('os');
const { exec } = require("child_process");
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

const store = new Store();

const API_KEY = store.get("api_key");
const API_URL = "https://wallhaven.cc/api/v1/search";

const autoLauncher = new AutoLaunch({
    name: 'Magic Wall'
});

const appGui = {};

app.allowRendererProcessReuse = true;

function getDefaultParameters() {
    return {
        "apiKey": getApiKey(),
        "resolutions" : getResolution(),
    }
};

function getApiKey() {
    var res = store.get("api_key");
    return res;
}

function getResolution() {
    var res = store.get("resolution", "1920x1080");
    return res;
}

function applyNewBackground(path) {
    if (os.platform() == "linux") {
        applyLinuxBackground(path);
    } else {
        wallpaper.set(path);
    }
}

function applyLinuxBackground(path) {
    const cmd = "echo $DESKTOP_SESSION";
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log('error:' + error.message);
            return;
        }
        if (stderr) {
            console.log('stderr:' + stderr);
            return;
        }
        const desktop = stdout.replace(/^\s+|\s+$/g, '');
        switch (desktop) {
            case "deepin":
                setDeepinBackground(path);
                break;
            case "xfce":
                setXfceBackground(path);
                break;
            default:
                wallpaper.set(path);
                break;
        }
    });
}

function setDeepinBackground(path) {
    const command = 'gsettings set com.deepin.wrap.gnome.desktop.background picture-uri ' + path;
    exec(command);
}

function setXfceBackground(path) {
    const cmd = "xfconf-query -c xfce4-desktop -l | grep 'last-image'";
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log('error:' , error.message);
            return;
        }
        if (stderr) {
            console.log('stderr:', stderr);
            return;
        }
        var screens = stdout.split("\n");
        for (var i = 0; i < screens.length; i++) {
            const screen = screens[i];
            if (screen == "") {
                continue;
            }
            const command = "xfconf-query --channel xfce4-desktop --property " + screen + " --set " + path;
            exec(command);
        }
    });
}

function applyRandomBackground() {
    var timestamp = new Date().getTime()
    var fpath = path.join(os.tmpdir(), 'bg' + timestamp + '.jpg');
    var file = fs.createWriteStream(fpath);
    var parameters = getDefaultParameters();
    parameters.q = store.get("search");
    parameters.sorting = "random";
    axios.get(API_URL, {
        params: parameters
    }).then(function (response) {
        if (typeof response.data.data[0] != undefined) {
            var item = response.data.data[0];
            axios.get(item.path, {
                responseType: 'stream'
            }).then(function (response) {
                var stream = response.data.pipe(file);
                stream.on('finish', function(){
                    applyNewBackground(fpath);
                });
            });
        }
    });
}

function createWindow() {
    if (appGui.win !== undefined) {
        appGui.win.show();
        return appGui.win;
    }

    const mainWindow = new BrowserWindow({
        width: 1270,
        height: 800,
        minWidth: 680,
        icon: path.join(__dirname, 'favicon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });
    mainWindow.setMenu(null);
    mainWindow.loadFile('dist/index.html');
    mainWindow.on("close", ev => {
        ev.sender.hide();
        ev.preventDefault();
    });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    appGui.win = mainWindow;
    return mainWindow;
}

function createTray() {
    if (appGui.tray !== undefined) {
        return appGui.tray;
    }

    const tray = new Tray(path.join(__dirname, 'favicon.png'));
    const menu = Menu.buildFromTemplate([
        {
            label: "Open", click: (item, window, event) => {
                createWindow();
            }
        },
        {
            label: "New background",
            click: applyRandomBackground
        },
        { type: "separator" },
        {
            label: "Exit MagicWall", click: () => {
                app.quit();
            }
        },
    ]);
    tray.setToolTip("Magic Wall");
    tray.setContextMenu(menu);

    appGui.tray = tray;
    return tray;
}

ipcMain.on('update_randomset', (event, data) => {
    store.set("randomset", data);
});

ipcMain.on('update_resolution', (event, data) => {
    store.set("resolution", data);
});

ipcMain.on('update_api_key', (event, data) => {
    store.set("api_key", data);
});

ipcMain.on('update_autostart', (event, data) => {
    if (data) {
        autoLauncher.enable();
    } else {
        autoLauncher.disable();
    }
});

ipcMain.on('search_loaded', (event) => {
    autoLauncher.isEnabled()
        .then(function (isEnabled) {
            var config = {
                "search": store.get('search'),
                "autostart": isEnabled,
                "randomset": store.get("randomset"),
                "api_key": store.get("api_key"),
                "resolution": getResolution(),
            };
            event.reply("get_config", config);
        });
});

ipcMain.on('apply_background', (event, arg) => {
    const timestamp = new Date().getTime()
    const fpath = path.join(os.tmpdir(), 'bg' + timestamp + '.jpg');
    const file = fs.createWriteStream(fpath);
    axios.get(arg, {
        responseType: 'stream'
    }).then(function (response) {
        const stream = response.data.pipe(file);
        stream.on('finish', function(){
            applyNewBackground(fpath);
            event.reply("background_changed", true);
        });
    });
});

ipcMain.on('search_query', (event, arg) => {
    store.set("search", arg.query);
    const parameters = getDefaultParameters();
    parameters.q = arg.query;
    axios.get(API_URL, {
        params: parameters
    }).then(function (response) {
        event.reply('search_result', response.data)
    });
});

ipcMain.on("load_more", (event, arg) => {
    const parameters = getDefaultParameters();
    parameters.q = arg.query;
    parameters.page = arg.page;
    axios.get(API_URL, {
        params: parameters
    }).then(function (response) {
        event.reply('more_result', response.data);
    });
});

app.once('ready', ev => {
    createTray();
    if (store.get("randomset")) {
        applyRandomBackground();
    }
    powerMonitor.on('shutdown', () => {
        app.quit();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    createWindow();
});
