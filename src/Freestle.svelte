<script>
  import { onMount, onDestroy } from "svelte";
  import { pop } from "svelte-spa-router";
  import Timer from "./Timer.svelte";
  import { hitTarget } from "./store.js";
  import Score from "./Score.svelte";
  import GameOver from "./GameOver.svelte";
  import Effects from "./Effects.svelte";

  const STATE = {
    GetReady: 0,
    Playing: 1,
    GameOver: 2
  };

  let gameType = "freestyle";

  let state = STATE.GameOver;

  let msg;
  let score;
  let scoreComp;
  let timer;
  let onTimerEnd;
  let combo = 0;
  let comboTimout;

  let effects;

  let hp;

  let maxHp;
  let minHit = 2;
  let hitWait = 0;

  function newGame() {
    score = 0;
    combo = 0;
    window.addEventListener("devicemotion", hit, true);
    getReady();
    scoreComp.reset();
  }

  function getReady() {
    state = STATE.GetReady;
    msg = "Get Ready!!";
    onTimerEnd = start;
    timer.setTime(3);
  }

  function start() {
    state = STATE.Playing;
    msg = "GO!!!";
    onTimerEnd = gameOver;
    timer.setTime(120);
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

      hit /= $hitTarget; //calibrate

      let scoreToAdd = hit * 100;
      if (combo > 2) scoreToAdd *= combo - 1;
      score += scoreToAdd;

      effects.spawnParticles(combo > 2 ? 6 : 2, x, y);

      //combo
      if (comboTimout) {
        clearInterval(comboTimout);
      }
      comboTimout = setTimeout(() => {
        combo = 0;
      }, 400);
      combo++;

      if (combo > 2) {
        let redLevel = 255 - (combo / 8) * 128;
        let c = `255,${redLevel},${redLevel}`;
        effects.flash(0.2, c);
      } else {
        effects.flash(0.2, "255,255,255");
      }
    }
  }

  function timerEnd() {
    onTimerEnd();
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

  .backBtn {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 30px;
    color: white;
  }

  .score {
    font-size: 30px;
    color: white;
    text-align: center;
    text-shadow: 0px 5px 5px black;
  }

  @media screen and (max-height: 460px) {
    .score {
      margin-top: 15px;
    }
  }
</style>

<div class="game" on:click={testHit}>
  <Effects bind:this={effects} />
  <div class="msg">{msg}</div>
  <div class="score">
    Score:
    <Score {score} bind:this={scoreComp} {combo} />
  </div>
  <Timer {gameType} bind:this={timer} on:end={timerEnd} />
  <div class="backBtn" on:click={() => pop()}>X</div>
  {#if state == STATE.GameOver}
    <GameOver on:restart={newGame} bind:gameType {score} />
  {/if}
</div>
