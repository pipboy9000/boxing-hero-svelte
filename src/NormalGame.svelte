<script>
  import { onMount, onDestroy } from "svelte";
  import { pop } from "svelte-spa-router";
  import Timer from "./Timer.svelte";

  const STATE = {
    GetReady: 0,
    Playing: 1,
    GameOver: 2
  };

  let state = STATE.GameOver;

  let hpBar;
  let hpColor;
  let msg;
  let timer;
  let onTimerEnd;
  let timerHidden = false;

  let level;
  let hp;
  let maxHp;

  let hitTarget = 10;
  let minHit = 2;
  let hitWait = 0;

  function newGame() {
    state = STATE.GetReady;
    hp = 45;
    maxHp = 45;
    level = 0;
    onTimerEnd = nextLevel;
    timer.setTime(3);
    // hitTarget = Calibrate.getHitTarget();
    hpBar.style.width = "100%";
    hpColor.style.backgroundColor = "#62ff00";
    msg = "Get Ready!dddeee!";
    window.addEventListener("devicemotion", hit, true);
  }

  function nextLevel() {
    state = STATE.Playing;
    maxHp = 45 + level * 5;
    hp = maxHp;
    hpBar.style.width = "100%";
    hpColor.style.backgroundColor = "#62ff00";
    msg = "GO!!!";
    onTimerEnd = gameOver;
    timer.setTime(10 + level * 3);
    level++;
  }

  function gameOver() {
    msg = "Game Over";
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

    console.log(hit, hitWait);

    if (state == STATE.Playing) {
      hitWait = 15;

      if (hit < minHit) return;

      hit /= hitTarget; //calibrate

      hp -= hit;

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

  function timerEnded() {
    onTimerEnd();
  }

  onMount(() => {
    newGame();
  });

  onDestroy(() => {
    gameOver();
  });
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
    text-shadow: 0 5px 3px black;
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
  }

  .middle {
    height: 130px;
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
  }

  .restartBtn {
    position: absolute;
    width: 200px;
    height: 60px;
    font-size: 25px;
    border-radius: 50px;
    border: 5px solid white;
    background: transparent;
    color: white;
    font-family: "Rubik", sans-serif;
    transition: opacity 0.5s ease-out;
    outline: none;
  }
</style>

<div class="game">
  <!-- <canvas class="effects" /> -->
  {#if level > 0}
    <div class="level">Level {level}</div>
  {/if}
  <div class="msg">{msg}</div>
  <div class="middle">
    {#if state == STATE.GameOver}
      <button class="restartBtn" on:click={newGame}>Restart</button>
    {/if}
    <Timer
      bind:this={timer}
      on:end={timerEnded}
      hidden={state == STATE.GameOver} />
  </div>
  <div class="hpContainer">
    <div class="hp" bind:this={hpBar}>
      <div class="hpColor" bind:this={hpColor} />
    </div>
  </div>
  <div class="backBtn" on:click={() => pop()}>X</div>
</div>
