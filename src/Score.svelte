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
        comboDiv.style.transform = `translate(-50%, -50%) scale(${1 +
          combo / 10})`;
      }

      if (combo == 0) {
        comboDiv.style.opacity = 0;
        comboDiv.style.transform = `translate(-50%, -50%) scale(1)`;
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
    position: fixed;
    left: 50%;
    top: 50%;
    font-size: 60px;
    transform: translate(-50%, -50%);
    left: 50%;
    text-shadow: 0px 0px 25px red, 0px 4px 1px red, -2px 0px 1px red,
      2px 0px 1px red, 0px 8px 1px #9f0000;
    transition: transform 0.25s cubic-bezier(0.25, 1.73, 0.7, -0.8),
      opacity 0.2s;
    opacity: 0;
  }
</style>

<div class="combo" bind:this={comboDiv}>{combo - 1}X</div>
<div class="score">{Math.round(currentScore)}</div>
