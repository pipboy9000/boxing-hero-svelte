<script>
  import { onMount, onDestroy } from "svelte";

  let active = false;

  let particles = [];

  let canvas, ctx;
  let width = window.innerWidth;
  let height = window.innerHeight;

  let PARTICLE_MAX_AGE = 20;

  let flashAmount = 0;
  let flashColor = "255,255,255";

  function initSize() {}

  onMount(() => {
    active = true;
    ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    initParticles();

    requestAnimationFrame(render);
  });

  onDestroy(() => {
    active = false;
  });

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  export function spawnParticles(amount, vx, vy) {
    for (let i = 0; i < amount; i++) {
      let p = particles.find(p => !p.active);
      if (!p) return;

      p.x = width / 2 + vx * Math.random() * 50;
      p.y = height / 2 + vy * Math.random() * 50;
      p.vx = vx + Math.random() * 10 - 5;
      p.vy = vy + Math.random() * 10 - 5;
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
        p.vy = p.vy * 0.96 + 1;
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
      flashAmount *= 0.93;
      if (flashAmount < 0.01) {
        flashAmount = 0;
      }
    }
    ctx.fillStyle = `rgba(${flashColor},${flashAmount})`;
    ctx.fillRect(0, 0, width, height);
  }

  export function flash(amount, color) {
    flashColor = color;
    flashAmount += amount;
  }

  function test() {
    let vx = Math.random() * 30 - 15;
    let vy = Math.random() * 30 - 15;
    flash(0.2);
    spawnParticles(5, vx, vy);
  }

  function render() {
    moveParticles();

    clear();
    drawFlash();
    drawParticles();

    if (active) requestAnimationFrame(render);
  }
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
