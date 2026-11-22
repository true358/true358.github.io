/* =========================================================
   Recolte - 押すだけ♥いいね機能（数字非表示・GAS連携）
   ========================================================= */
(function () {
  // ★ここにGASの「ウェブアプリ URL」を貼り付けてください★
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwRo6HOARAGeTp6bl1kMcO6XyyPw-U1ITRfgZdtxg7CKC0DkFWvC-0aJ0cxNnNdE2ih5w/exec';

  // 1ページあたりの1日送信上限（連打・スパム対策）
  const DAILY_LIMIT = 10;

  // アニメーション・吹き出し用のCSSを自動注入（HTML側へのCSS追記不要）
  const style = document.createElement('style');
  style.textContent = `
    .like-btn {
      position: relative;
      overflow: visible;
    }

    /* 押した瞬間だけネオンピンクに光り、アニメーション終了後に元の色へ戻る */
    .like-btn.is-pop {
      background: #e4e4ec;
      border-color: #ff2bd6;
      color: #ff2bd6;
      box-shadow: 0 0 14px rgba(255, 43, 214, 0.55);
    }

    .like-btn.is-pop svg {
      animation: recolteHeartPop 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes recolteHeartPop {
      0%   { transform: scale(1); }
      35%  { transform: scale(1.48); }
      68%  { transform: scale(0.92); }
      100% { transform: scale(1); }
    }

    /* 押した瞬間に広がるネオンピンクの光の波紋 */
    .like-ripple {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2.5px solid #ff2bd6;
      box-shadow: 0 0 12px rgba(255, 43, 214, 0.75);
      pointer-events: none;
      z-index: 185;
      animation: recolteLikeRipple 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes recolteLikeRipple {
      0% {
        opacity: 0.95;
        transform: translate(-50%, -50%) scale(0.5);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(2.4);
      }
    }

    /* 大きく弾け飛ぶハートパーティクル */
    .like-particle {
      position: absolute;
      left: 50%;
      top: 50%;
      color: #ff2bd6;
      text-shadow: 0 0 8px rgba(255, 43, 214, 0.85),
                   0 0 16px rgba(255, 43, 214, 0.45);
      pointer-events: none;
      user-select: none;
      line-height: 1;
      z-index: 190;
      animation: recolteHeartFloat 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes recolteHeartFloat {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(0.55) rotate(0deg);
      }
      25% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.35) rotate(var(--rot));
      }
    }

    .like-toast {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(17, 17, 21, 0.94);
      border: 1px solid #ff2bd6;
      box-shadow: 0 4px 16px rgba(255, 43, 214, 0.32);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-6px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 200;
    }

    .like-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  // 今日の日付キー（YYYY-MM-DD）
  function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getCount(storageKey) {
    try {
      return Number(localStorage.getItem(storageKey) || '0');
    } catch (e) {
      return 0;
    }
  }

  function setCount(storageKey, count) {
    try {
      localStorage.setItem(storageKey, String(count));
    } catch (e) {
      // プライベートブラウズ等で保存できない場合はスキップ
    }
  }

  // 大きめのハート＆光の波紋エフェクトを発生
  function spawnEffects(btn) {
    // 広がるネオンピンクの波紋
    const ripple = document.createElement('span');
    ripple.className = 'like-ripple';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 660);

    // 大小ミックスのハート6個を左右〜斜め下へ大きく飛ばす（ヘッダー上端で見切れない軌道）
    const particles = [
      { tx: '-46px', ty: '14px', size: '22px', rot: '-24deg' },
      { tx: '-30px', ty: '48px', size: '18px', rot: '-14deg' },
      { tx: '-10px', ty: '58px', size: '24px', rot: '-6deg'  },
      { tx: '14px',  ty: '54px', size: '17px', rot: '10deg'  },
      { tx: '34px',  ty: '40px', size: '21px', rot: '18deg'  },
      { tx: '44px',  ty: '8px',  size: '16px', rot: '26deg'  }
    ];

    particles.forEach((p) => {
      const span = document.createElement('span');
      span.className = 'like-particle';
      span.textContent = '♥';
      span.style.fontSize = p.size;
      span.style.setProperty('--tx', p.tx);
      span.style.setProperty('--ty', p.ty);
      span.style.setProperty('--rot', p.rot);
      btn.appendChild(span);
      setTimeout(() => span.remove(), 920);
    });
  }

  // ボタンへ機能をバインド
  document.querySelectorAll('.like-btn').forEach((btn) => {
    const pageName = btn.dataset.page || location.pathname.split('/').pop() || 'unknown';
    const storageKey = `recolte_like_${pageName}_${getTodayKey()}`;

    // トースト吹き出しを生成
    const toast = document.createElement('span');
    toast.className = 'like-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    btn.appendChild(toast);

    let popTimer = null;
    let toastTimer = null;

    btn.addEventListener('click', () => {
      // タップ後のフォーカス残りを防ぐ
      btn.blur();

      // 押した瞬間だけピンク発光＆弾むアニメーションを再生し、0.5秒後に元の色へ戻す
      btn.classList.remove('is-pop');
      void btn.offsetWidth;
      btn.classList.add('is-pop');
      clearTimeout(popTimer);
      popTimer = setTimeout(() => {
        btn.classList.remove('is-pop');
      }, 500);

      spawnEffects(btn);

      const currentCount = getCount(storageKey);

      if (currentCount >= DAILY_LIMIT) {
        toast.textContent = 'たくさんありがとう！❤';
      } else {
        toast.textContent = 'Thank you!';
        setCount(storageKey, currentCount + 1);

        // GASへ非同期送信（URL設定済みの場合のみ）
        if (GAS_URL && GAS_URL.startsWith('https://')) {
          fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              page: pageName,
              title: document.title
            })
          }).catch(() => {});
        }
      }

      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 1800);
    });
  });
})();