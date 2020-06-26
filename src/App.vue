<template>
  <div id="app">
    <Search/>
  </div>
</template>

<script>
import Search from './components/Search.vue'

export default {
  name: 'App',
  components: {
    Search
  }
}
</script>

<style>
@import "font/stylesheet.css";
#app {
  font-family: 'days_oneregular', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body,
html{
  /* background: #313131; */
  background: white;
  padding: 0;
}
</style>
