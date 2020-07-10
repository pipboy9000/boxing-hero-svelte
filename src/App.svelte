<script>
  import { onMount, onDestroy } from "svelte";
  import Router from "svelte-spa-router";
  import { routes } from "./routes.js";
  import { push, pop, replace, location } from "svelte-spa-router";

  let isFullScreen;
  let page;

  location.subscribe(l => {
    page = l.split("/")[1];
  });

  onMount(async () => {
    page = $location.split("/")[1];
    if (page) {
      await replace("/");
      push("/" + page);
    }
  });

  async function fullScreen() {
    if (!isFullScreen) {
      document.body.requestFullscreen();
      isFullScreen = true;
    } else {
      document.exitFullscreen();
      isFullScreen = false;
    }
  }
</script>

<style>
  :global(body) {
    background: url("../images/leather.jpg");
    background-size: contain;
    background-position: center;
    display: flex;
    align-items: center;
    flex-direction: column;
    font-family: "Rubik", sans-serif;
    margin: 0;
    padding: 0;
    white-space: nowrap;
    width: 100vw;
    min-height: -webkit-fill-available;
    overflow: hidden;
    user-select: none;
  }

  :global(html) {
    background: url("../images/leather.jpg");
    background-size: contain;
    background-position: center;
    padding: 0;
    margin: 0;
    max-height: 100vh;
    overflow: hidden;
  }

  :global(button) {
    outline: none;
  }

  @font-face {
    font-family: Rubik;
    src: url("../fonts/Rubik-Bold.ttf");
  }

  .fullScreenBtn {
    position: absolute;
    bottom: 15px;
    left: 15px;
    width: 40px;
    background: #0d0d0d87;
    border-radius: 3px;
    z-index: 9999;
  }

  .backBtn {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 30px;
    color: white;
    z-index: 9999;
  }
</style>

<Router {routes} />
<img
  on:click={fullScreen}
  class="fullScreenBtn"
  src="../images/full_screen_icon.svg"
  alt="full screen button" />
{#if page}
  <div class="backBtn" on:click={() => pop()}>X</div>
{/if}
