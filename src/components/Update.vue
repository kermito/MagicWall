<template>
    <div id="updater">
        <div id="version"></div>
        <div id="notificationUpdate" class="hidden">
            <p id="message"></p>
            <button id="close-button" @click="closeNotification">
                Close
            </button>
            <button id="restart-button" @click="restartApp" class="hidden">
                Restart
            </button>
        </div>
    </div>
</template>
<script>
export default {
    name: "Update",
    mounted() {
        var notification = document.getElementById('notificationUpdate');
        var message = document.getElementById('message');
        var restartButton = document.getElementById('restart-button');
        var version = document.getElementById('version');
        
        window.ipcRenderer.send('app_version');
        
        window.ipcRenderer.on('app_version', (event, arg) => {
            window.ipcRenderer.removeAllListeners('app_version');
            version.innerText = 'Version ' + arg.version;
        });
        
        window.ipcRenderer.on('update_available', function() {
            window.ipcRenderer.removeAllListeners('update_available');
            message.innerText = 'A new update is available. Downloading now...';
            notification.classList.remove('hidden');
        });

        window.ipcRenderer.on('update_downloaded', function() {
            window.ipcRenderer.removeAllListeners('update_downloaded');
            message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
            restartButton.classList.remove('hidden');
            notification.classList.remove('hidden');
        });
    },
    methods: {
        closeNotification() {
            document.getElementById('notificationUpdate').classList.add('hidden');
        },
        restartApp() {
            window.ipcRenderer.send('restart_app');
        }
    }
}
</script>
<style>
#notificationUpdate {
    position: fixed;
    left: 10%;
    right: 10%;
    background: #eaeaea;
    padding: 20px;
}

button {
    color: #fff;
    background: #646464;
    border: none;
    padding: 10px 20px;
    transition:0.3s;
}

#notification {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 200px;
  padding: 20px;
  border-radius: 5px;
  background-color: white;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
}
.hidden {
  display: none;
}

#version {
  font-size: 9px;
}
</style>