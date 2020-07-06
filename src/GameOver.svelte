<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let score;

  export let gameType;

  let topScore;

  function getTopScore() {
    switch (gameType) {
      case "normal":
        topScore = +localStorage.getItem("topScoreNormal") || 0;
        break;

      case "freestyle":
        topScore = +localStorage.getItem("topScoreFreestyle") || 0;
        break;

      case "reaction":
        topScore = +localStorage.getItem("topScoreReaction") || 0;
        break;
    }
  }

  function setTopScore() {
    console.log("set top score");
    switch (gameType) {
      case "normal":
        localStorage.setItem("topScoreNormal", topScore);
        break;

      case "freestyle":
        localStorage.setItem("topScoreFreestyle", topScore);
        break;

      case "reaction":
        localStorage.setItem("topScoreReaction", topScore);
        break;
    }
  }

  $: {
    if (score > topScore) {
      setTopScore();
      topScore = score;
    }
  }

  onMount(() => {
    getTopScore();
  });

  function restart() {
    dispatch("restart");
  }
</script>

<style>
  .bg {
    width: 100%;
    height: 100%;
    background: #000000b5;
    display: flex;
    flex-direction: column;
    position: absolute;
    color: white;
    text-align: center;
    align-items: center;
    justify-content: center;
  }

  .restart {
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
    margin: 0;
    padding: 0;
  }

  h1 {
    margin: 0;
    font-size: 65px;
    text-shadow: 0px 5px 5px black;
  }

  h2 {
    margin: 0;
    font-size: 25px;
    margin-top: 12px;
  }

  .scores {
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: space-evenly;
  }

  .score > div {
    font-size: 60px;
    text-shadow: 0px 5px 5px black;
  }

  .bottom {
    height: 70%;
    display: flex;
    align-items: center;
  }

  @media screen and (max-height: 460px) {
    .score > div {
      font-size: 50px;
    }

    h2 {
      font-size: 20px;
    }
  }

  @media screen and (max-height: 300px) {
    .score > div {
      font-size: 40px;
    }

    h2 {
      margin-top: 0px;
    }
  }

  @media screen and (min-height: 400px) {
    h1 {
      margin-top: 20px;
      font-size: 80px;
    }
  }
</style>

<div class="bg">
  <h1>Game Over</h1>
  <div class="scores">
    <div class="score">
      <h2>Score:</h2>
      <div>{Math.round(score)}</div>
    </div>
    <div class="score">
      <h2>Top Score:</h2>
      <div>{Math.round(topScore)}</div>
    </div>
  </div>
  <div class="bottom">
    <button class="restart" on:click={restart}>Restart</button>
  </div>
</div>
