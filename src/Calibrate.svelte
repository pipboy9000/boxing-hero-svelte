<script>
  import { onMount, onDestroy } from "svelte";
  import { pop } from "svelte-spa-router";
  import { hitTarget } from "./store.js";

  let slider;

  let hitLevel;
  let hitWait = 0;
  let greenWait = 0;
  let active;

  let hitCircle;
  let hitRing;

  onMount(async () => {
    window.addEventListener("devicemotion", hit, true);
    active = true;
    slider.value = 31 - $hitTarget;
    render();
  });

  onDestroy(() => {
    window.removeEventListener("devicemotion", hit, true);
    active = false;
  });

  function setHitTarget(e) {
    hitTarget.set(31 - e.target.value);
  }

  function testHit() {
    let event = {
      acceleration: {
        x: 10 + (Math.random() * 10 - 5),
        y: 0,
        z: 0
      }
    };

    hit(event);
    hitWait = 0;
    setTimeout(() => {
      greenWait = 0;
    }, 500);
  }

  function hit(event) {
    let x = event.acceleration.x;
    let y = event.acceleration.y;
    let z = event.acceleration.z;

    let v = Math.sqrt(x * x + y * y + z * z); //movement vector length

    if (v > 2) {
      hitLevel = v;
      hitWait = 10;

      let n = v / $hitTarget; //normalize with hitTarget

      if (n > 0.9 && n < 1.1) {
        greenWait = 30;
      }
    }
    greenWait--;
  }

  function render() {
    if (!active) return;
    let n = hitLevel / $hitTarget;

    if (greenWait > 28) {
      hitCircle.style.transform = `scale(1)`;
    } else if (n > 0.01) {
      hitCircle.style.transform = `scale(${n})`;
    } else {
      hitCircle.style.transform = `scale(0)`;
    }

    if (greenWait > 0) {
      hitRing.style.border = "5px solid #1dff4f";
    } else {
      hitRing.style.border = "";
    }

    hitLevel *= 0.875;

    if (hitWait > 0) {
      hitWait--;
    }

    requestAnimationFrame(render);
  }
</script>

<style>
  .calibrate {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .hit {
    width: 100%;
    height: 60vh;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hit > img {
    border-radius: 1000px;
    width: 70%;
    max-width: 300px;
  }

  .hitCircle {
    padding-bottom: min(70%, 300px);
    padding-right: min(70%, 300px);
    width: 0;
    height: 0;
    transform: scale(0, 0);
    position: absolute;
    background: white;
    border-radius: 1000px;
    z-index: -999;
  }

  .slider {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 40px;
    margin-top: 40px;
  }

  .slider > input {
    margin: 0;
    margin-left: 10px;
    margin-right: 10px;
    width: 60%;
    font-size: 5px;
  }

  .backBtn {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 20px;
    color: white;
  }
</style>

<div class="calibrate" on:click={testHit}>
  <div class="hit">
    <div class="hitCircle" bind:this={hitCircle} />
    <img src="images/glove.png" alt="Hit Me!" bind:this={hitRing} />
  </div>
  <div class="slider">
    -
    <input
      type="range"
      min="1"
      max="30"
      step="1"
      on:change={setHitTarget}
      bind:this={slider} />
    +
  </div>
  <div
    class="backBtn"
    on:click={() => {
      pop();
    }}>
    X
  </div>
</div>
