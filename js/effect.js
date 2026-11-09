/* ==========================================
   Recolte: タップエフェクト (js/effect.js)
========================================== */
document.addEventListener('pointerdown', (e) => {
  // リンク、ボタン、画像全般、各ページ特有のサムネクラスを完全網羅！
  const isInteractive = e.target.closest(
    'a, button, input, label, img, .gallery-item, .log-item, .masonry-item, [data-full], .back-to-top, .header-btn, .tag-btn, .date-pill, .tag-pill'
  );

  if (isInteractive) {
    createCyberRing(e.clientX, e.clientY);
  } else {
    createSubtleSparkles(e.clientX, e.clientY);
  }
});

function createCyberRing(x, y) {
  const ring = document.createElement('div');
  ring.className = 'cyber-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  document.body.appendChild(ring);
  setTimeout(() => { ring.remove(); }, 500);
}

function createSubtleSparkles(x, y) {
  const count = 8;
  const colors = ['#d2f83d', '#38bdf8', '#ffffff', '#e5cbff', '#c6ff00'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'subtle-particle';
    
    // 粒径: 4px〜7px
    const size = Math.floor(Math.random() * 4) + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;

    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.backgroundColor = color;
    p.style.boxShadow = `0 0 5px ${color}, 0 0 10px ${color}`;
    p.style.left = `${x - size / 2}px`;
    p.style.top = `${y - size / 2}px`;

    const angle = Math.random() * Math.PI * 2;
    // 飛散距離: 25px〜50px
    const distance = Math.random() * 25 + 25;
    p.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

    document.body.appendChild(p);
    setTimeout(() => { p.remove(); }, 420);
  }
}