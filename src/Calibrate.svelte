<script>
  import { onMount, onDestroy } from "svelte";
  import { pop } from "svelte-spa-router";

  //   slider.oninput = e => {
  //     hitTarget = 31 - +e.target.value;
  //     localStorage.setItem("hitTarget", hitTarget);
  //   };

  //for testing
  // calibrateDiv.onclick = e => {
  //     let event = {
  //         acceleration: {
  //             x: 10,
  //             y: 0,
  //             z: 0,
  //         }
  //     }

  //     hit(event);
  //     hitWait = 0;
  //     setTimeout(() => {
  //         greenWait = 0;
  //     }, 500)
  // }

  //   let hitTarget = parseInt(localStorage.getItem("hitTarget") || 10);
  //   slider.value = 31 - hitTarget;
  //   let hitLevel = 0;
  //   let active = false;
  //   let hitWait = 0; //frames to wait before registering another hit
  //   let greenWait = 0; //frames to wait before clearing green ring color

  //   function hit(event) {
  //     let x = event.acceleration.x;
  //     let y = event.acceleration.y;
  //     let z = event.acceleration.z;

  //     let v = Math.sqrt(x * x + y * y + z * z); //movement vector length

  //     if (v > 2) {
  //       hitLevel = v;
  //       hitWait = 10;

  //       let n = v / hitTarget; //normalize with hitTarget
  //       console.log(n);
  //       if (n > 0.9 && n < 1.1) {
  //         greenWait = 30;
  //       }
  //     }

  //     greenWait--;
  //   }

  //   function render() {
  //     console.log("calibrate render");
  //     let n = hitLevel / hitTarget;

  //     if (greenWait > 28) {
  //       hitCircle.style.transform = `scale(1)`;
  //     } else {
  //       hitCircle.style.transform = `scale(${n})`;
  //     }

  //     if (greenWait > 0) {
  //       hitRing.style.border = "5px solid #1dff4f";
  //     } else {
  //       hitRing.style.border = "";
  //     }

  //     hitLevel *= 0.875;

  //     if (hitWait > 0) {
  //       hitWait--;
  //     }

  //     if (active) {
  //       requestAnimationFrame(render);
  //     }
  //   }

  //   function getHitTarget() {
  //     return hitTarget;
  //   }
</script>

<style>
  .calibrate {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .hit {
    width: 100%;
    height: 60vh;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hitRing {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hitRing > img {
    border-radius: 1000px;
    width: 70%;
    max-width: 300px;
  }

  .hitCircle {
    padding-bottom: min(70%, 300px);
    padding-right: min(70%, 300px);
    width: 0;
    height: 0;
    transform: scale(0, 0);
    position: absolute;
    background: white;
    border-radius: 1000px;
    z-index: -999;
  }

  .slider {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 40px;
    margin-top: 40px;
  }

  .slider > input {
    margin: 0;
    margin-left: 10px;
    margin-right: 10px;
    width: 60%;
  }
</style>

<div class="calibrate">
  <div class="hit">
    <div class="hitRing">
      <div class="hitCircle" />
      <img src="images/glove.png" alt="Hit Me!" />
    </div>
  </div>
  <div class="slider">
    -
    <input type="range" min="1" max="30" step="1" value="15" />
    +
  </div>
  <div class="backBtn">X</div>
</div>
