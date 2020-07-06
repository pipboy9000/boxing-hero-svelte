<script>
  import { onMount, onDestroy } from "svelte";
  import { pop } from "svelte-spa-router";
  import Timer from "./Timer.svelte";
  import { hitTarget } from "./store.js";
  import Score from "./Score.svelte";
  import { fade } from "svelte/transition";
  import GameOver from "./GameOver.svelte";

  const STATE = {
    GetReady: 0,
    Playing: 1,
    GameOver: 2
  };

  let gameType = "normal";

  let state = STATE.GameOver;

  let hpBar;
  let hpColor;
  let msg;
  let score;
  let scoreComp;
  let timer;
  let onTimerEnd;
  let timerHidden = false;

  let level;
  let hp;

  let maxHp;
  let minHit = 2;
  let hitWait = 0;

  function newGame() {
    score = 0;
    hp = 45;
    maxHp = 45;
    level = 0;
    hpBar.style.width = "100%";
    hpColor.style.backgroundColor = "#62ff00";
    window.addEventListener("devicemotion", hit, true);
    getReady();
    scoreComp.reset();
  }

  function getReady() {
    state = STATE.GetReady;
    msg = "Get Ready!!";
    hpBar.style.width = "100%";
    hpColor.style.backgroundColor = "#62ff00";
    onTimerEnd = nextLevel;
    timer.setTime(1);
    level++;
  }

  function nextLevel() {
    if (state == STATE.GameOver) return;
    state = STATE.Playing;
    maxHp = 45 + level * 5;
    hp = maxHp;
    msg = "GO!!!";
    onTimerEnd = gameOver;
    timer.setTime(3 + (level - 1) * 3);
  }

  function gameOver() {
    // msg = "Game Over";
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

      hp -= hit;

      score += hit * 100;

      if (hp < 0) hp = 0;

      let hpNormalized = hp / maxHp;
      hpBar.style.width = hpNormalized * 100 + "%";
      hpColor.style.backgroundColor = `hsl(${Math.floor(
        hpNormalized * 120
      )},100%,60%)`;

      // Effects.spawnParticles(5, x, y);
      // Effects.flash(0.2);

      if (hp == 0) {
        getReady();
      }
    }
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
        x: 10 + (Math.random() * 10 - 5),
        y: 0,
        z: 0
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

  .level {
    color: white;
    font-size: 30px;
    height: 40px;
    text-shadow: 0 5px 3px black;
    margin-top: 20px;
  }

  .msg {
    color: white;
    font-size: 60px;
    text-align: center;
    text-shadow: 0 5px 3px black;
  }

  .hpContainer {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding-left: 10px;
    padding-right: 10px;
  }

  .hp {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      #f4f4f4 0%,
      #eaeaea 47%,
      #d4d4d4 48%,
      #464646 100%
    );
    box-shadow: 0 10px 20px #0000009c, 3px 3px 2px #00000063 inset,
      -3px -4px 2px #909090 inset;
    transition: width 0.5s;
    border-radius: 7px;
    position: relative;
  }

  .middle {
    height: 100%;
    width: 100%;
    justify-content: center;
    align-items: center;
    display: flex;
  }

  .hpColor {
    background-color: #62ff00;
    width: 100%;
    height: 100%;
    mix-blend-mode: multiply;
    transition: background-color 0.3s ease-out;
    border-radius: 7px;
    position: absolute;
  }

  .texts {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .backBtn {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 20px;
    color: white;
  }

  .bottom {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .score {
    font-size: 30px;
    color: white;
    text-align: center;
  }

  .barHighlight {
    position: absolute;
    width: 100%;
    height: 64%;
    background: white;
    top: 0;
    right: 0;
    border-radius: 3px;
    opacity: 1.5;
    background: linear-gradient(
      25deg,
      #ffffff,
      #fff0,
      #ffffffd4 80%,
      #fff0 87%,
      #ffffffc7 100%
    );
    box-sizing: border-box;
    mix-blend-mode: overlay;
  }

  @media screen and (max-height: 460px) {
    .middle {
      height: 0;
    }

    .score {
      margin-top: 15px;
    }
  }
</style>

<div class="game" on:click={testHit}>
  <div class="texts">
    <div class="level">Level {level == 0 ? 1 : level}</div>
    <div class="msg">{msg}</div>
    <div class="score">
      Score:
      <Score {score} bind:this={scoreComp} />
    </div>
  </div>
  <div class="middle">
    <Timer
      bind:this={timer}
      on:end={onTimerEnd}
      hidden={state == STATE.GameOver} />
  </div>
  <div class="bottom">
    <div class="hpContainer">
      <div class="hp" bind:this={hpBar}>
        <div class="hpColor" bind:this={hpColor} />
        <div class="barHighlight" />
      </div>
    </div>
  </div>
  <div class="backBtn" on:click={() => pop()}>X</div>
  {#if state == STATE.GameOver}
    <GameOver on:restart={newGame} bind:gameType {score} />
  {/if}
</div>
