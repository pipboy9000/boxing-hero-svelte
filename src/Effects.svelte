<script>
  import { onMount, onDestroy } from "svelte";

  let particles = [];

  let canvas, ctx;
  let width = window.innerWidth;
  let height = window.innerHeight;

  let PARTICLE_MAX_AGE = 20;

  let flashAmount = 0;

  function initSize() {}

  onMount(() => {
    ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
  });

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function spawnParticles(amount, vx, vy) {
    for (let i = 0; i < amount; i++) {
      let p = particles.find(p => !p.active);
      if (!p) return;

      p.x = width / 2 + vx * Math.random() * 30;
      p.y = height / 2 + vy * Math.random() * 30;
      p.vx = vx + Math.random() * 20 - 10;
      p.vy = vy + Math.random() * 20 - 10;
      p.active = true;
      p.age = 0;
    }
  }

  function moveParticles() {
    particles.forEach(p => {
      if (p.active) {
        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.96;
        p.vy = p.vy * 0.98 + 2;
        p.age += 1;

        if (p.age > PARTICLE_MAX_AGE) {
          p.active = false;
        }
      }
    });
  }

  function initParticles() {
    for (let i = 0; i < 200; i++) {
      let p = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        age: 0,
        active: false
      };
      particles.push(p);
    }
  }

  function drawParticles() {
    ctx.globalCompositeOperation = "overlay";
    particles.forEach(p => {
      if (p.active) {
        ctx.beginPath();
        let life = p.age / PARTICLE_MAX_AGE;
        ctx.fillStyle = `rgb(255, 255, 255)`;
        ctx.arc(p.x, p.y, 3 - life * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawFlash() {
    if (flashAmount > 0) {
      flashAmount *= 0.87;
      if (flashAmount < 0.01) {
        flashAmount = 0;
      }
    }
    ctx.fillStyle = `rgba(255,255,255,${flashAmount})`;
    ctx.fillRect(0, 0, width, height);
  }

  function flash(amount) {
    flashAmount = amount;
  }

  function test() {
    let vx = Math.random() * 30 - 15;
    let vy = Math.random() * 30 - 15;
    flash(0.2);
    spawnParticles(5, vx, vy);
  }

  function init() {
    canvas = document.getElementsByClassName("effects")[0];
    canvas.addEventListener("click", test, false);
    ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    initParticles();

    requestAnimationFrame(render);
  }

  function render() {
    moveParticles();

    clear();
    drawFlash();
    drawParticles();

    requestAnimationFrame(render);
  }

  init();
</script>

<style>
  .effects {
    width: 100%;
    height: 100%;
    position: absolute;
    pointer-events: none;
  }
</style>

<canvas class="effects" bind:this={canvas} />
