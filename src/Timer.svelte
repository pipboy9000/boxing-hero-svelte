<script>
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import { tick } from "svelte";

  export let gameType = "normal";

  const dispatch = createEventDispatcher();

  let time = 0;

  let timerInterval;

  let circle;

  onMount(() => {
    dispatch("loaded");
  });

  export function setTime(seconds) {
    if (timerInterval) clearInterval(timerInterval);

    time = seconds;

    circle.style.transition = "";
    circle.style.strokeDashoffset = 0;

    setTimeout(() => {
      if (!circle) return;
      circle.style.transition =
        "stroke-dashoffset " +
        seconds +
        "s linear, stroke " +
        seconds +
        "s linear";
      circle.style.strokeDashoffset = -99;
    }, 100);

    timerInterval = setTimeout(timeTick, 1000);
  }

  function timeTick() {
    time--;
    if (time == 0) {
      dispatch("end");
    } else {
      timerInterval = setTimeout(timeTick, 1000);
    }
  }
</script>

<style>
  .timer {
    position: absolute;
    color: white;
    font-size: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timerSeconds {
    position: absolute;
    font-size: 40px;
  }

  .timerCircle {
    fill: none;
    stroke-width: 7;
    stroke-linecap: round;
    stroke-dasharray: 100 100;
    stroke-dashoffset: 0;
    stroke: white;
    transition: opacity 0.5s;
  }

  .freestyle {
    position: relative;
    margin-top: 20px;
  }

  @media screen and (max-height: 460px) {
    .timer {
      position: fixed;
      left: 20px;
      top: 20px;
    }
  }
</style>

<div class="timer" class:freestyle={gameType == 'freestyle'}>
  <div class="timerSeconds">{time}</div>
  <svg width="110" height="110">
    <circle
      bind:this={circle}
      class="timerCircle"
      cx="55"
      cy="55"
      r="50"
      pathlength="100" />
  </svg>
</div>
