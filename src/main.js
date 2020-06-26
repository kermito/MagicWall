import Vue from 'vue';
import App from './App.vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCog, faSearch, faImage, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faCog);
library.add(faSearch);
library.add(faImage);
library.add(faSpinner);

Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');

var infiniteScroll = require('vue-infinite-scroll');
Vue.use(infiniteScroll);
