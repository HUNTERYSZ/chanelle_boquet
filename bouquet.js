
(() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");

  const intro = document.getElementById("intro");
  const gift = document.getElementById("gift");
  const openButton = document.getElementById("openButton");
  const replayButton = document.getElementById("replayButton");

  let W, H, DPR, startTime = 0;
  let animationStarted = false;
  let lastTime = 0;
  let elapsed = 0;

  const reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const ease = t => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };

  const backEase = t => {
    t = clamp(t, 0, 1);
    const c = 1.45;
    return 1 + (c + 1) * Math.pow(t - 1, 3)
             + c * Math.pow(t - 1, 2);
  };

  const pinks = [
    "#ff75a9",
    "#ff91ba",
    "#ffb4cb",
    "#ec659d",
    "#ff9dc5",
    "#ffd0df",
    "#e978a8"
  ];

  const deepPinks = [
    "#e84e91",
    "#d95791",
    "#f47eaa",
    "#f7a4c0"
  ];

  const greens = [
    "#397c58",
    "#4b9666",
    "#65a875",
    "#286c4b"
  ];

  let flowers = [];
  let stems = [];
  let leaves = [];
  let stars = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * DPR;
    canvas.height = H * DPR;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    createBouquet();
  }

  function createBouquet() {
    flowers = [];
    stems = [];
    leaves = [];
    stars = [];

    const count = 48;

    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const radius = Math.sqrt(Math.random());

      const x = Math.cos(angle) * radius * rand(65, 135);
      const y = -Math.abs(Math.sin(angle)) * radius * 105
                - rand(5, 65);

      flowers.push({
        x,
        y,
        size: rand(9, 15),
        petals: Math.floor(rand(5, 9)),
        color: pinks[Math.floor(Math.random() * pinks.length)],
        inner: deepPinks[Math.floor(Math.random() * deepPinks.length)],
        center: Math.random() > .5 ? "#ffd36e" : "#ffe69b",
        angle: rand(0, Math.PI * 2),
        delay: i * .075,
        scale: 0
      });
    }

    for (let i = 0; i < 11; i++) {
      const angle = (i / 11) * Math.PI * 2;

      stems.push({
        x: Math.cos(angle) * rand(8, 45),
        y: rand(45, 100),
        delay: .3 + i * .09,
        color: greens[i % greens.length]
      });
    }

    for (let i = 0; i < 13; i++) {
      leaves.push({
        x: rand(-70, 70),
        y: rand(20, 115),
        size: rand(12, 24),
        angle: rand(-1.1, 1.1),
        delay: .8 + i * .07,
        color: greens[i % greens.length]
      });
    }

    for (let i = 0; i < 20; i++) {
      stars.push({
        x: rand(0, W),
        y: rand(0, H),
        size: rand(.5, 1.5),
        alpha: rand(.08, .25)
      });
    }
  }

  // Draw one complete flower from individual petals.
  function drawFlower(f, progress) {
    if (progress <= 0) return;

    const bloom = backEase(progress);
    const size = f.size * bloom;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);

    ctx.globalAlpha = ease(progress);

    for (let i = 0; i < f.petals; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI * 2 / f.petals);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        size * .35, -size * .15,
        size * .7, -size * .75,
        0, -size
      );
      ctx.bezierCurveTo(
        -size * .7, -size * .75,
        -size * .35, -size * .15,
        0, 0
      );

      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 5;
      ctx.fill();

      ctx.restore();
    }

    // Inner petals
    for (let i = 0; i < f.petals; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI * 2 / f.petals + .2);

      ctx.beginPath();
      ctx.ellipse(
        0, -size * .32,
        size * .22, size * .4,
        0, 0, Math.PI * 2
      );

      ctx.fillStyle = f.inner;
      ctx.globalAlpha = progress * .85;
      ctx.fill();
      ctx.restore();
    }

    // Flower center
    ctx.globalAlpha = progress;
    ctx.beginPath();
    ctx.arc(0, 0, size * .24, 0, Math.PI * 2);
    ctx.fillStyle = f.center;
    ctx.shadowColor = f.center;
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.restore();
  }

  function drawStem(stem, progress) {
    if (progress <= 0) return;

    const p = ease(progress);

    ctx.save();
    ctx.globalAlpha = p;
    ctx.strokeStyle = stem.color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(stem.x * .15, 130);

    ctx.bezierCurveTo(
      stem.x * .4, 105,
      stem.x * .8, 65,
      stem.x, 130 - stem.y * p
    );

    ctx.stroke();
    ctx.restore();
  }

  function drawLeaf(leaf, progress) {
    if (progress <= 0) return;

    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);

    const size = leaf.size * ease(progress);

    ctx.globalAlpha = ease(progress);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      size, -size * .2,
      size * 1.2, -size,
      0, -size * 1.2
    );
    ctx.bezierCurveTo(
      -size * .8, -size * .7,
      -size * .7, -size * .2,
      0, 0
    );

    ctx.fillStyle = leaf.color;
    ctx.shadowColor = leaf.color;
    ctx.shadowBlur = 4;
    ctx.fill();

    ctx.restore();
  }

  // Bouquet rotates as ONE group.
  function drawBouquet(time) {
    const progress = ease((time - 200) / 2200);
    const rotationStart = 3.0;
    const rotation = reducedMotion
      ? 0
      : Math.max(0, time - rotationStart * 1000) * .00017;

    const scale = Math.min(W / 390, H / 680);
    const cx = W / 2;
    const cy = H * .43;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.rotate(rotation);

    // Stems appear first.
    stems.forEach(s => {
      const p = clamp((time - s.delay * 1000) / 800, 0, 1);
      drawStem(s, p);
    });

    // Leaves grow after stems.
    leaves.forEach(l => {
      const p = clamp((time - l.delay * 1000) / 500, 0, 1);
      drawLeaf(l, p);
    });

    // Petals build flower by flower.
    flowers.forEach(f => {
      const p = clamp(
        (time - 800 - f.delay * 1000) / 650,
        0, 1
      );

      drawFlower(f, p);
    });

    ctx.restore();
  }

  // White Bubu: independent of bouquet rotation.
  function drawBubu(time) {
    const scale = Math.min(W / 390, H / 680);
    const x = W / 2;
    const y = H * .76 + Math.sin(time * .0015) * 3;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Body
    ctx.fillStyle = "#f1eaff";
    ctx.beginPath();
    ctx.ellipse(0, 42, 43, 39, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    for (const ex of [-29, 29]) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex, -28, 21, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffb5cc";
      ctx.beginPath();
      ctx.arc(ex, -28, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, 0, 49, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blinking eyes
    const phase = time % 5600;
    const blink = phase > 4750 && phase < 5020
      ? Math.sin((phase - 4750) / 270 * Math.PI)
      : 0;

    [-17, 17].forEach(ex => {
      ctx.strokeStyle = "#25252b";
      ctx.fillStyle = "#25252b";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      if (blink > .1) {
        ctx.beginPath();
        ctx.moveTo(ex - 4, -4);
        ctx.quadraticCurveTo(ex, -4 + 8 * blink, ex + 4, -4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(ex, -4, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex + 1.5, -6, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Nose
    ctx.fillStyle = "#ff9db9";
    ctx.beginPath();
    ctx.ellipse(0, 11, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = "#c87990";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 12, 8, .15, Math.PI - .15);
    ctx.stroke();

    // Cheeks
    ctx.fillStyle = "rgba(255,155,180,.4)";
    ctx.beginPath();
    ctx.ellipse(-30, 14, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(30, 14, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawBackground() {
    ctx.clearRect(0, 0, W, H);

    const gradient = ctx.createRadialGradient(
      W / 2, H * .48, 10,
      W / 2, H * .48, Math.max(W, H) * .65
    );

    gradient.addColorStop(0, "#17243d");
    gradient.addColorStop(.55, "#0c1428");
    gradient.addColorStop(1, "#070b16");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Very subtle background points only.
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = "#a6b8d8";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!animationStarted) return;

    if (!lastTime) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, .04);
    lastTime = now;
    elapsed += dt;

    drawBackground();

    const time = reducedMotion ? 10000 : now - startTime;

    drawBouquet(time);

    // Bubu appears after the bouquet has mostly bloomed.
    if (time > 2300) {
      drawBubu(time - 2300);
    }

    requestAnimationFrame(frame);
  }

  function startAnimation() {
    animationStarted = true;
    elapsed = 0;
    lastTime = 0;
    startTime = performance.now();

    intro.classList.add("hidden");
    gift.classList.add("visible");

    requestAnimationFrame(frame);
  }

  openButton.addEventListener("click", startAnimation);

  replayButton.addEventListener("click", () => {
    animationStarted = false;
    intro.classList.remove("hidden");
    gift.classList.remove("visible");

    setTimeout(() => {
      startAnimation();
    }, 800);
  });

  window.addEventListener("resize", resize);

  resize();
  drawBackground();
})();
