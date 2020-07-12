<script>
  import { onMount, onDestroy } from "svelte";
  import { pop } from "svelte-spa-router";
  import Timer from "./Timer.svelte";
  // import { hitTarget } from "./store.js";
  import GameOver from "./GameOver.svelte";
  import Effects from "./Effects.svelte";

  const STATE = {
    GetReady: 0,
    Playing: 1,
    GameOver: 2
  };

  let gameType = "reaction";

  let state = STATE.GameOver;

  let msg;
  let score;
  let scoreAnimText;
  let timer;
  let onTimerEnd;

  let effects;

  let minHit = 2;
  let hitWait = 0;

  let targetState = false; //red when false, green when true
  let nextGreenTimeout;
  let nextRedTimeout;
  let greenTime;

  function newGame() {
    score = 0;
    window.addEventListener("devicemotion", hit, true);
    getReady();
  }

  function getReady() {
    state = STATE.GetReady;
    msg = "Get Ready!!";
    onTimerEnd = start;
    timer.setTime(1);
  }

  function start() {
    state = STATE.Playing;
    msg = "GO!!!";
    onTimerEnd = gameOver;
    timer.setTime(120);
    nextRed();
  }

  function nextRed() {
    if (nextRedTimeout) clearTimeout(nextRedTimeout);
    targetState = false;
    let wait = 0.3 + Math.random() * 2;
    nextGreenTimeout = setTimeout(nextGreen, wait * 1000);
  }

  function nextGreen() {
    if (nextGreenTimeout) clearTimeout(nextGreenTimeout);
    targetState = true;
    greenTime = performance.now();
    let wait = 1.2;
    nextRedTimeout = setTimeout(nextRed, wait * 1000);
  }

  function gameOver() {
    state = STATE.GameOver;
    window.removeEventListener("devicemotion", hit, true);
  }

  function hit(event) {
    if (hitWait > 0) {
      hitWait--;
      return;
    }

    let x = event.acceleration.x;
    let y = event.acceleration.y;
    let z = event.acceleration.z;

    let hit = Math.sqrt(x * x + y * y + z * z); //movement vector length

    if (state == STATE.Playing) {
      hitWait = 15;

      if (hit < minHit) return;

      // hit /= $hitTarget; //calibrate

      let addToScore;

      if (targetState) {
        //target is green;
        addToScore = ((1500 - (performance.now() - greenTime)) / 1500) * 150;
        console.log(addToScore);
        nextRed();
      } else {
        //target is red;
        addToScore = -100;
      }

      score += addToScore;

      popScore(addToScore);

      effects.spawnParticles(4, x, y);

      effects.flash(0.2, "255,255,255");
    }
  }

  function timerEnd() {
    onTimerEnd();
  }

  function popScore(s) {
    scoreAnimText.innerHTML = Math.round(s);
    scoreAnimText.classList.remove("scoreAnim");
    setTimeout(() => {
      scoreAnimText.classList.add("scoreAnim");
    }, 10);
  }

  onMount(() => {
    newGame();
  });

  onDestroy(() => {
    gameOver();
  });

  function testHit() {
    let event = {
      acceleration: {
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5,
        z: Math.random() * 10 - 5
      }
    };

    hit(event);
    hitWait = 0;
  }
</script>

<style>
  .game {
    display: flex;
    position: absolute;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .msg {
    color: white;
    font-size: 60px;
    text-align: center;
    text-shadow: 0 5px 3px black;
  }

  .score {
    color: white;
    font-size: 50px;
    margin: 20px;
  }

  .targetContainer {
    width: 50vh;
    height: 50vh;
    max-width: 50vw;
    max-height: 50vw;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .target {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 430px;
  }

  .timer {
    width: 100%;
    height: 100%;
    padding: 10px;
    z-index: 999;
  }
  .green {
    background: #00ff08;
    box-shadow: 0 0 50px 5px #20ff20;
  }

  .red {
    background: #ff2020;
    box-shadow: 0 0 50px 5px red;
  }

  .scorePop {
    position: absolute;
    z-index: 99999;
    opacity: 0;
    transform: translateY(50px);
    color: white;
    font-size: 70px;
    font-family: "Rubik", sans-serif;
    text-shadow: 0 10px 0 #00000073;
  }

  :global(.scoreAnim) {
    animation: scoreAnim 1s linear;
  }

  @keyframes scoreAnim {
    0% {
      transform: translateY(50px);
      opacity: 0;
    }
    50% {
      transform: translateY(0px);
      opacity: 1;
    }
    85% {
      transform: translateY(0px);
      opacity: 1;
    }
    100% {
      transform: translateY(0px);
      opacity: 0;
    }
  }
</style>

<div class="game" on:click={testHit}>
  <div class="msg">{msg}</div>
  <div class="scorePop" bind:this={scoreAnimText}>+125</div>
  <div class="score">Score: {Math.round(score)}</div>
  <div class="targetContainer">
    <div class="timer">
      <Timer bind:this={timer} on:end={timerEnd} />
    </div>
    <div class="target" class:green={targetState} class:red={!targetState} />
    <div class="green" />
  </div>
  <Effects bind:this={effects} />
  {#if state == STATE.GameOver}
    <GameOver on:restart={newGame} bind:gameType {score} />
  {/if}
</div>
