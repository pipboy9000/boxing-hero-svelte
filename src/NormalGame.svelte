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

  let gameType = "normal";

  let state = STATE.GameOver;

  let hpBar;
  let hpColor;
  let msg;
  let score;
  let scoreComp;
  let timer;
  let onTimerEnd;
  let combo = 0;
  let comboTimout;

  let effects;

  let level;
  let hp;

  let maxHp;
  let minHit = 2;
  let hitWait = 0;

  function newGame() {
    score = 0;
    combo = 0;
    hp = 45;
    maxHp = 45;
    level = 0;
    hpBar.style.width = "100%";
    hpColor.style.backgroundColor = "#62ff00";
    window.addEventListener("devicemotion", hit, true);
    getReady(3);
    scoreComp.reset();
  }

  function getReady(seconds) {
    state = STATE.GetReady;
    msg = "Get Ready!!";
    hpBar.style.width = "100%";
    hpColor.style.backgroundColor = "#62ff00";
    onTimerEnd = nextLevel;
    level++;
    timer.setTime(seconds);
  }

  function nextLevel() {
    if (state == STATE.GameOver) return;
    state = STATE.Playing;
    maxHp = 45 + level * 5;
    hp = maxHp;
    msg = "GO!!!";
    onTimerEnd = gameOver;
    timer.setTime(30 + (level - 1) * 3);
  }

  function gameOver() {
    state = STATE.GameOver;
    window.removeEventListener("devicemotion", hit, true);
  }

  function timerEnd() {
    onTimerEnd();
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

      let scoreToAdd = hit * 100;

      //combo
      if (comboTimout) {
        clearInterval(comboTimout);
      }
      comboTimout = setTimeout(() => {
        combo = 0;
      }, 400);
      combo++;

      if (combo > 2) scoreToAdd *= combo - 1;
      score += scoreToAdd;

      if (hp < 0) hp = 0;

      let hpNormalized = hp / maxHp;
      hpBar.style.width = hpNormalized * 100 + "%";
      hpColor.style.backgroundColor = `hsl(${Math.floor(
        hpNormalized * 120
      )},100%,60%)`;

      effects.spawnParticles(combo > 2 ? 6 : 2, x, y);

      if (combo > 2) {
        let redLevel = 255 - (combo / 8) * 128;
        let c = `255,${redLevel},${redLevel}`;
        effects.flash(0.2, c);
      } else {
        effects.flash(0.2, "255,255,255");
      }

      if (hp == 0) {
        getReady(10 + level * 3);
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
    position: relative;
    max-width: 35vh;
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

  .bottom {
    width: 100%;
    height: 100%;
    margin-top: 20px;
  }

  .score {
    font-size: 30px;
    color: white;
    text-align: center;
    text-shadow: 0px 5px 5px black;
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

  .timer {
    margin-top: 20px;
  }

  @media screen and (max-height: 460px) {
    .timer {
      position: fixed;
      left: 20px;
      top: 20px;
      width: 100px;
      height: 100px;
    }

    .middle {
      height: 0;
    }
  }
  @media screen and (max-width: 610px) and (max-height: 460px) {
    .msg {
      font-size: 40px;
    }
  }
</style>

<div class="game" on:click={testHit}>
  <Effects bind:this={effects} />
  <div class="texts">
    <div class="level">Level {level == 0 ? 1 : level}</div>
    <div class="msg">{msg}</div>
    <div class="score">
      Score:
      <Score {score} bind:this={scoreComp} {combo} />
    </div>
  </div>
  <div class="middle">
    <div class="timer">
      <Timer bind:this={timer} on:end={timerEnd} />
    </div>
  </div>
  <div class="bottom">
    <div class="hpContainer">
      <div class="hp" bind:this={hpBar}>
        <div class="hpColor" bind:this={hpColor} />
        <div class="barHighlight" />
      </div>
    </div>
  </div>
  {#if state == STATE.GameOver}
    <GameOver on:restart={newGame} bind:gameType {score} />
  {/if}
</div>
