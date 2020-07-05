<script>
  import { onMount, onDestroy } from "svelte";

  export let score = 0;
  let currentScore = 0;
  let active = false;

  onMount(() => {
    active = true;
    requestAnimationFrame(render);
  });

  onDestroy(() => {
    active = false;
  });

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
</style>

<div class="score">{Math.round(currentScore)}</div>
