<script>
  import { push, pop, replace } from "svelte-spa-router";
</script>

<style>
  .menu {
    position: absolute;
    display: flex;
    align-items: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    justify-content: center;
  }

  .items {
    display: flex;
    align-items: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    max-height: 40vh;
    max-width: 330px;
    overflow: auto;
    scroll-behavior: smooth;
    scroll-snap-type: both;
  }

  .logo {
    background-image: url("../images/logo.png");
    width: 90%;
    height: 40%;
    max-width: 860px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .item {
    text-align: center;
    width: 90%;
    max-width: 300px;
    height: 60px;
    font-family: "Rubik", sans-serif;
    background: none;
    border: none;
    color: white;
    font-size: 2.2em;
    text-shadow: 0px 8px 2px #0000008a;
    padding-top: 15px;
    padding-bottom: 15px;
    scroll-snap-align: start;
    box-sizing: content-box;
  }

  /* scrollbars */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-button {
    width: 15px;
    height: 15px;
  }
  ::-webkit-scrollbar-thumb {
    background: #e1e1e1;
    border: 0px none #ffffff;
    border-radius: 50px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #ffffff;
  }
  ::-webkit-scrollbar-thumb:active {
    background: #ffffff;
  }
  ::-webkit-scrollbar-track {
    background: #666666;
    border: 0px none #ffffff;
    border-radius: 50px;
  }
  ::-webkit-scrollbar-track:hover {
    background: #666666;
  }
  ::-webkit-scrollbar-track:active {
    background: #333333;
  }
  ::-webkit-scrollbar-corner {
    background: transparent;
  }

  hr {
    width: 60%;
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent, white, transparent);
    margin: 0;
  }
</style>

<div id="menu" class="menu">
  <div class="logo" />
  <hr />
  <div class="items">
    <div class="item" on:click={() => push('/game')}>New Game</div>
    <div class="item" on:click={() => push('/freestyle')}>Free Style</div>
    <div class="item" on:click={() => push('/callibrate')}>Calibrate</div>
    <div class="item" on:click={() => push('/options')}>Options</div>
  </div>
  <hr />
</div>
