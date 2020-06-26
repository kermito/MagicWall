<template>
  <div class="background">
    <img v-bind:src="background.thumbs.small" v-bind:alt="background.id">
    <button v-on:click="setAsBackground"><font-awesome-icon icon="image" /> Apply</button>
  </div>
</template>

<script>
export default {
  name: 'Background',
  props: {
    background : Object
  },
  methods: {
    setAsBackground: function(){
      window.ipcRenderer.send('apply_background', this.background.path);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .background img {
    width: 100%;
    max-width: 300px;
    margin: 0;
  }
  .background button svg{
    color:#f1713f
  }
  .background button {
    width: 100%;
    padding: 5px;
    border:none;
    font-family: days_oneregular;
    font-weight: 500;
  }
  .background {
    flex-grow: 1;
    margin: 10px 0;
    background: #f1f1f1;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    box-shadow: #54525269 4px 4px 4px 0px;
  }
</style>
