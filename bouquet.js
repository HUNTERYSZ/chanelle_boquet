// ─── BOUQUET DATA ───────────────────────────────────────────────────────────
// each entry: [text, colorKey]
// colorKey: 1-6 = pinks/reds, 7 = stem green, 8 = leaf green, 9 = ribbon/bow

const ROWS = [
  // ambient sparkles
  ["           *    .    *    .    *          ", 1],
  ["        .    *    . ♡ .    *    .         ", 1],
  ["      *    .    *   ~~~   *    .    *     ", 1],

  // rose cluster top
  ["       ,-'~~`-.  ,-'~~`-.  ,-'~~`-.      ", 2],
  ["      / ,d88b. \\ / ,d88b. \\ / ,d88b. \\   ", 3],
  ["     | | 8888 | | | 8888 | | | 8888 | |  ", 4],
  ["     | | Y88P | | | Y88P | | | Y88P | |  ", 3],
  ["      \\ `~--~' /|\\ `~--~' /|\\ `~--~' /   ", 2],
  ["  ,-'~~\\      /~~~\\      /~~~\\      /`-.  ", 2],
  [" / ,d88 `----' 88b `----' 88b `----' 88b\\", 3],
  ["| | 8888      8888        8888       8888||", 4],
  ["| | Y88P      Y88P        Y88P       Y88P||", 3],
  [" \\ `~--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~' /", 2],

  // second tier roses
  ["  `-.  ,-'~~`-.       ,-'~~`-.       ,-' ", 2],
  ["     \\/ ,d88b. \\     / ,d88b. \\     /    ", 3],
  ["     || | 8888 |     | | 8888 |     |    ", 4],
  ["     || | 888P |     | | 888P |     |    ", 3],
  ["     |\\ `~--~' /     \\ `~--~' /     |    ", 2],
  ["     |  `-----'       `-------'     |    ", 2],

  // petals spreading open below
  ["     |  ( ~~~ )       ( ~~~ )       |    ", 3],
  ["     | (  ~~~  )     (  ~~~  )      |    ", 4],
  ["     |(  ~~~~~  )   (  ~~~~~  )     |    ", 3],
  ["     | (  ~~~  )     (  ~~~  )      |    ", 2],
  ["     |  `-----'       `-------'     |    ", 2],

  // leaves
  ["  .~.|  |                     |  |.~.    ", 8],
  [" /~~~\\ |  |    ,--.   ,--.    |  | /~~~\\ ", 8],
  ["( ~~~ )|  |   /    \\ /    \\   |  |( ~~~ )", 8],
  [" \\~~~/ |  |   \\    / \\    /   |  | \\~~~/ ", 8],
  ["  `--' |  |    `--'   `--'    |  |  `--' ", 8],

  // main stems
  ["       |  |                   |  |       ", 7],
  ["       |  |    |         |    |  |       ", 7],
  ["       |  |    |         |    |  |       ", 7],
  ["       |  |____|         |____|  |       ", 7],
  ["       |  |                   |  |       ", 7],
  ["       |__|                   |__|       ", 7],
  ["         |                     |         ", 7],
  ["         |                     |         ", 7],

  // ribbon wrap
  ["    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   ", 5],
  ["  ~( ( ( ( ( CHANELLE ♡ ) ) ) ) ) )~    ", 6],
  ["    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   ", 5],

  // bow
  ["          __         __                  ", 2],
  ["        ,'  `-.   .-'  `.               ", 3],
  ["       /  ♡    `-'    ♡  \\             ", 4],
  ["       \\       /|\\       /             ", 3],
  ["        `.___.' | `.___.'               ", 2],
  ["               _|_                       ", 2],
  ["              /~~~\\                      ", 3],
  ["             ( ~~~ )                     ", 4],
  ["              \\~~~/ ♡                   ", 3],
];

// ─── COLOR PALETTE ──────────────────────────────────────────────────────────

const COLOR_MAP = {
  1: ['#ffd6e7', '#ffb3cc', '#ffe0ee'],          // blush sparkles
  2: ['#ffb3cc', '#ff9abc', '#ffc8d8'],           // light pink petals
  3: ['#ff69a0', '#ff79b0', '#ff5ca8'],           // mid pink
  4: ['#ff1493', '#ff0080', '#e0157a'],           // hot pink center
  5: ['#e0157a', '#c01068', '#ff1493'],           // ribbon magenta
  6: ['#ff69a0', '#ff1493', '#ffb3cc'],           // ribbon text
  7: ['#4aaa4a', '#3a9a3a', '#5acc5a'],           // stems
  8: ['#2a7a2a', '#3a9c3a', '#48b848'],           // leaves
};

const PINK_BURST = [
  '#ffb3cc', '#ff69a0', '#e0157a',
  '#ff1493', '#ffaad4', '#ff5ca8',
  '#ffc0cb', '#e91e8c',
];

// ─── STATE ──────────────────────────────────────────────────────────────────

let glowPhase = 0;
let sparkMode = false;

// ─── RENDER ─────────────────────────────────────────────────────────────────

function safeChar(ch) {
  if (ch === '<') return '&lt;';
  if (ch === '>') return '&gt;';
  if (ch === '&') return '&amp;';
  return ch;
}

function colorSpan(ch, cols, glow) {
  if (ch === ' ') return ' ';
  const col = sparkMode
    ? PINK_BURST[Math.floor(Math.random() * PINK_BURST.length)]
    : cols[Math.floor(Math.random() * cols.length)];
  const shadow = (glow || sparkMode)
    ? `text-shadow:0 0 8px ${col},0 0 20px ${col};`
    : '';
  return `<span style="color:${col};${shadow}">${safeChar(ch)}</span>`;
}

function buildFrame() {
  glowPhase += 0.035;
  let html = '';

  ROWS.forEach(([txt, colorKey], rowIdx) => {
    const cols = COLOR_MAP[colorKey] || ['#ffb3cc'];
    let line = '';

    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (ch === ' ') { line += ' '; continue; }
      const wave = Math.sin(glowPhase + rowIdx * 0.22 + i * 0.1);
      line += colorSpan(ch, cols, wave > 0.65);
    }

    html += line + '\n';
  });

  return html;
}

// ─── ANIMATION LOOP ─────────────────────────────────────────────────────────

const canvas = document.getElementById('canvas');

function animate() {
  canvas.innerHTML = buildFrame();
  requestAnimationFrame(animate);
}

animate();

// ─── BURST EFFECT ───────────────────────────────────────────────────────────

function spawnHearts() {
  const hb = document.getElementById('heartburst');
  hb.innerHTML = '';

  const chars = ['♡', '♡', '<3', '♡', '*', '♡', '~'];

  for (let i = 0; i < 32; i++) {
    const el = document.createElement('div');
    el.className = 'hb';
    el.textContent = chars[i % chars.length];
    el.style.left = (8 + Math.random() * 84) + '%';
    el.style.top  = (10 + Math.random() * 70) + '%';
    el.style.color = PINK_BURST[Math.floor(Math.random() * PINK_BURST.length)];
    el.style.fontSize = (10 + Math.random() * 20) + 'px';
    el.style.animationDelay = (Math.random() * 0.6) + 's';
    el.style.textShadow = `0 0 12px ${PINK_BURST[Math.floor(Math.random() * PINK_BURST.length)]}`;
    hb.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

function spawnSparks(cx, cy) {
  for (let i = 0; i < 20; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = cx + 'px';
    s.style.top  = cy + 'px';

    const angle = Math.random() * Math.PI * 2;
    const dist  = 50 + Math.random() * 140;
    s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');

    s.style.color    = PINK_BURST[Math.floor(Math.random() * PINK_BURST.length)];
    s.textContent    = ['♡', '*', '+', '·', '~'][Math.floor(Math.random() * 5)];
    s.style.fontSize = (10 + Math.random() * 14) + 'px';

    document.body.appendChild(s);
    setTimeout(() => s.remove(), 2000);
  }
}

function burst(e) {
  sparkMode = true;
  setTimeout(() => { sparkMode = false; }, 900);

  spawnHearts();

  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  spawnSparks(cx, cy);
}

// ─── EVENTS ─────────────────────────────────────────────────────────────────

canvas.addEventListener('click', burst);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  burst(e);
}, { passive: false });
