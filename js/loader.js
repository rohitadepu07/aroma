// Aroma Qasr — Background Asset Preloader
// Smoothly loads and decodes images in background before revealing the page

(function () {
  const PRELOADER_HTML = `
    <div id="site-preloader" aria-hidden="true">
      <div class="preloader-ambient-glow"></div>
      <div class="preloader-content">
        <div class="preloader-emblem">
          <div class="preloader-emblem-ring"></div>
          <svg class="preloader-svg-logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="aqPreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFA08A"/>
                <stop offset="50%" stop-color="#E85038"/>
                <stop offset="100%" stop-color="#B82C18"/>
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="rgba(232,80,56,0.08)" stroke="url(#aqPreGrad)" stroke-width="1.8"/>
            <path d="M32 14 L34 20 L30 20 Z" fill="#FFA08A"/>
            <rect x="29" y="20" width="6" height="3" rx="0.8" fill="#FFFFFF"/>
            <path d="M23 25 C23 23.5, 41 23.5, 41 25 L44 47 C44 50, 20 50, 20 47 Z" fill="url(#aqPreGrad)" stroke="#FFA08A" stroke-width="1.2"/>
            <text x="32" y="39" font-family="'Playfair Display', serif" font-size="10.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">AQ</text>
          </svg>
        </div>
        <h2 class="preloader-brand-title">Aroma Qasr</h2>
        <span class="preloader-brand-sub">Maison De Parfum • Crafting Experience</span>
        <div class="preloader-progress-track">
          <div class="preloader-progress-fill" id="preloader-progress-fill"></div>
        </div>
        <div class="preloader-status-row">
          <span id="preloader-status-text">Curating essences...</span>
          <span id="preloader-pct">0%</span>
        </div>
      </div>
    </div>
  `;

  // 1. Inject immediately into document body
  function injectPreloader() {
    if (document.getElementById('site-preloader')) return;
    const temp = document.createElement('div');
    temp.innerHTML = PRELOADER_HTML;
    const el = temp.firstElementChild;
    if (document.body) {
      document.body.prepend(el);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.prepend(el));
    }
  }

  injectPreloader();

  // 2. Preload & Decode Images in Background
  let currentPct = 0;
  let targetPct = 15;
  let isFinished = false;

  function updateProgressUI(pct) {
    const fill = document.getElementById('preloader-progress-fill');
    const textPct = document.getElementById('preloader-pct');
    const statusText = document.getElementById('preloader-status-text');

    if (fill) fill.style.width = `${pct}%`;
    if (textPct) textPct.textContent = `${Math.round(pct)}%`;

    if (statusText) {
      if (pct < 45) {
        statusText.textContent = 'Curating essences...';
      } else if (pct < 80) {
        statusText.textContent = 'Loading visual repertoire...';
      } else {
        statusText.textContent = 'Unveiling flacons...';
      }
    }
  }

  // Smooth animation step
  const ticker = setInterval(() => {
    if (currentPct < targetPct) {
      currentPct += (targetPct - currentPct) * 0.25 + 0.5;
      if (currentPct > targetPct) currentPct = targetPct;
      updateProgressUI(currentPct);
    }
  }, 30);

  function finishLoading() {
    if (isFinished) return;
    isFinished = true;
    targetPct = 100;
    updateProgressUI(100);
    clearInterval(ticker);

    setTimeout(() => {
      const preloader = document.getElementById('site-preloader');
      if (preloader) {
        preloader.classList.add('loaded');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 700);
      }
    }, 280);
  }

  // Collect images to preload & decode
  function trackImages() {
    const images = Array.from(document.querySelectorAll('img, video[poster]'));
    if (images.length === 0) {
      targetPct = 100;
      setTimeout(finishLoading, 400);
      return;
    }

    let loadedCount = 0;
    const totalCount = images.length;

    function onImageDone() {
      loadedCount++;
      const calculated = Math.round((loadedCount / totalCount) * 85) + 15;
      if (calculated > targetPct) {
        targetPct = calculated;
      }
      if (loadedCount >= totalCount) {
        finishLoading();
      }
    }

    images.forEach((img) => {
      if (img.tagName.toLowerCase() === 'img') {
        if (img.complete && img.naturalHeight !== 0) {
          if (img.decode) {
            img.decode().then(onImageDone).catch(onImageDone);
          } else {
            onImageDone();
          }
        } else {
          img.addEventListener('load', () => {
            if (img.decode) {
              img.decode().then(onImageDone).catch(onImageDone);
            } else {
              onImageDone();
            }
          });
          img.addEventListener('error', onImageDone);
        }
      } else {
        onImageDone();
      }
    });

    // Fallback maximum timeout to guarantee fast UX (max 1.5s)
    setTimeout(finishLoading, 1500);
  }

  if (document.readyState === 'complete') {
    trackImages();
  } else {
    window.addEventListener('load', trackImages);
    document.addEventListener('DOMContentLoaded', () => {
      targetPct = 50;
    });
  }
})();
