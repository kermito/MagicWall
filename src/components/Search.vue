<template>
  <div class="container">

    <div v-bind:class="{ 'open': isSettingsActive, 'settings': true }">
        <label for="autostart">
            <input type="checkbox" name="autostart" id="autostart" v-model="autostart" v-on:change="changeAutostart()">
            Run on startup
        </label>

        <label for="randomset">
            <input type="checkbox" name="randomset" id="randomset" v-model="randomset" v-on:change="changeRandomSet()">
            Random background when starting (based on search)
        </label>

        <div class="config">
            <label for="resolution">
                Resolution of backgrounds
            </label>
            <input type="text" name="resolution" id="resolution" v-model="resolution" v-on:change="customResolution()">
        </div>

        <div class="config">
            <label for="apikey">
                Your wallhaven API key
            </label>
            <input type="text" name="api_key" id="api_key" v-model="api_key" v-on:change="customApiKey()">
        </div>
    </div>

    <form id="searchform" action="javascript:;" class="searchbar" v-on:submit="getResult">
        <input type="text"
          class=""
          placeholder="Recherche"
          value="futurama"
          v-model="search">
        <button type="submit">
          <font-awesome-icon v-if="isLoadingNewResults" icon="spinner" class="spin" />
          <font-awesome-icon v-else icon="search" />
        </button>
    </form>

    <div v-if="backgrounds && backgrounds.length" class="results">
        <background v-for="(item, index) in backgrounds"
          v-bind:background="item"
          v-bind:index="index"
          v-bind:key="index"/>
    </div>
    <div v-else-if="!isLoadingNewResults" class="no-results">
        Nothing.
    </div>

    <div v-if="isLoadingMoreResults" class="loading-more">
        <font-awesome-icon icon="spinner" class="spin" />
    </div>

    <div class="openSettings">
        <a href="javascript:;" class="btn round-btn" v-on:click="toggleSettings()">
            <font-awesome-icon icon="cog" />
        </a>
    </div>
  </div>
</template>

<script>
import Background from "./Background.vue";

export default {
    name: 'Search',
    components : {
      "background" : Background
    },
    data() {
        return  {
            backgrounds: [],
            searchSettings: [],
            isSettingsActive : false,
            autostart : false,
            randomset : false,
            search : null,
            api_key : null,
            resolution : null,
            scrollEventDisabled : true,
            current_page : 1,
            isLoadingNewResults: false,
            isLoadingMoreResults: false
        }
    },
    methods: {
        toggleSettings: function() {
            window.scrollTo(0,0);
            if (this.$data.isSettingsActive) {
                this.$data.isSettingsActive = false;
            } else {
                this.$data.isSettingsActive = true
            }
        },
        getResult: function() {
            this.$data.current_page = 1;
            this.$data.isLoadingNewResults = true;
            window.ipcRenderer.send('search_query', {
                "query" : this.search
            });
        },
        loadMore: function() {
            var vm = this;
            if (vm.$data.current_page < vm.$data.searchSettings.last_page) {
                vm.$data.current_page++;
                vm.$data.isLoadingMoreResults = true;
                window.ipcRenderer.send('load_more', {
                    "query" : vm.$data.search,
                    "page"  : vm.$data.current_page
                });
            }
        },
        watchResult: function() {
            var vm = this;

            window.ipcRenderer.on("get_config",function(ev, data) {
                vm.$data.search     = data.search;
                vm.$data.autostart  = data.autostart;
                vm.$data.randomset  = data.randomset;
                vm.$data.resolution  = data.resolution;
                vm.$data.api_key  = data.api_key;

                if (vm.$data.search != null) {
                    vm.getResult();
                }
            });

            window.ipcRenderer.on("search_result",function(ev, data) {
                vm.$data.backgrounds            = data.data;
                vm.$data.searchSettings         = data.meta;
                vm.$data.scrollEventDisabled    = false;
                vm.$data.isLoadingNewResults    = false;
            });

            window.ipcRenderer.on("more_result",function(ev, data) {
                for (let i = 0; i < data.data.length; i++) {
                    const bkg = data.data[i];
                    vm.$data.backgrounds.push(bkg);
                }
                vm.$data.searchSettings         = data.meta;
                vm.$data.isLoadingMoreResults   = false;
            });
        },
        scroll: function() {
            var vm = this;
            window.onscroll = () => {
                let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight;

                if (bottomOfWindow && !vm.$data.scrollEventDisabled) {
                    this.loadMore();
                }
            }
        },
        changeAutostart: function(){
            window.ipcRenderer.send('update_autostart', this.$data.autostart);
        },
        changeRandomSet: function(){
            window.ipcRenderer.send('update_randomset', this.$data.randomset);
        },
        customResolution: function(){
            window.ipcRenderer.send('update_resolution', this.$data.resolution);
        },
        customApiKey: function(){
            window.ipcRenderer.send('update_api_key', this.$data.api_key);
        }
    },
    created() {
        this.watchResult();
        window.ipcRenderer.send("search_loaded");
    },
    mounted() {
        this.scroll();
    }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
@keyframes spin {
    0%  {transform: rotate(0deg);}
    100% {transform: rotate(360deg);}
}

* {
    font-family: 'Montserrat', sans-serif;
}

.spin {
    animation: spin .75s infinite ease-out;
}

.openSettings a{
    color:#313131;
    padding: 20px;
    border-radius: 500px;
    bottom: 20px;
    position: fixed;
    background: rgba(255,255,255,0.5);
    right: 20px;
}

.settings.open {
    margin-top: 0;
    transition: 0.3s;
}

.settings {
    position: relative;
    background: white;
    width: 100%;
    margin: 0;
    padding: 10px 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex-wrap: 1;
    margin-top: -50px;
    transition: 0.3s;
}

.settings .config{
    display: flex;
    flex-direction: row;
}

.settings .config label{
    width:auto;
}

.settings label{
    flex-grow: 1;
    min-width: 200px;
}

.searchbar {
    display: flex;
    flex-direction: row;
    padding: 0 0 10px 0;
    margin-top: 0;
    position: fixed;
    left: 8px;
    right: 8px;
    top: 0;
    z-index: 99;
}

.searchbar button:hover {
    background: #fff;
    color: #646464;
    transition:0.3s;
}
.searchbar button {
    color: #fff;
    background: #646464;
    border: none;
    padding: 10px 20px;
    transition:0.3s;
}

.searchbar input[type=checkbox]:active,
.searchbar input[type=checkbox] {
    flex-grow: 1;
    font-size: 25px;
    border:none;
    border-bottom: 1px solid black;
    color: black;
    background: white;
    text-transform: uppercase;
    padding:5px;
    font-family: days_oneregular;
}

.searchbar:active,
.searchbar {
    flex-grow: 1;
    font-size: 25px;
    border:none;
    border-bottom: 1px solid black;
    color: black;
    background: white;
    text-transform: uppercase;
    font-family: days_oneregular;
}

.results {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
}

.no-results {
    margin: 10px 20px;
    text-align: center;
}

.loading-more {
    margin: 10px 20px;
    text-align: center;
}

.container {
    margin-top: 40px;
}
</style>
