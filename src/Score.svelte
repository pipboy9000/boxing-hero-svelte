<script>
  import { onMount, onDestroy } from "svelte";

  export let score;
  export let combo;

  let currentScore = 0;
  let active = false;

  let comboDiv;

  onMount(() => {
    active = true;
    requestAnimationFrame(render);
  });

  onDestroy(() => {
    active = false;
  });

  $: {
    if (comboDiv) {
      if (combo > 2) {
        comboDiv.style.opacity = 1;
        comboDiv.style.transform = `translate(-50%, -15%) scale(${1 +
          combo / 6})`;
      }

      if (combo == 0) {
        comboDiv.style.opacity = 0;
        comboDiv.style.transform = `translate(-50%, -15%) scale(1)`;
      }
    }
  }

  export function reset() {
    score = 0;
    currentScore = 0;
  }

  function render() {
    if (!active) return;

    if (Math.abs(currentScore - score) > 0.1) {
      currentScore += (score - currentScore) / 15;
    }

    requestAnimationFrame(render);
  }
</script>

<style>
  .score {
    color: white;
    font-size: 50px;
    text-align: center;
  }

  .combo {
    position: absolute;
    font-size: 60px;
    transform: translate(-50%, -15%);
    left: 50%;
    text-shadow: 0px 0px 25px red, 0px 4px 1px red, -2px 0px 1px red,
      2px 0px 1px red, 0px 8px 1px #9f0000;
    transition: transform 0.3s cubic-bezier(0.6, -0.6, 0.36, 1.53), opacity 0.2s;
  }
</style>

<div class="combo" bind:this={comboDiv}>{combo - 1}X</div>
<div class="score">{Math.round(currentScore)}</div>
