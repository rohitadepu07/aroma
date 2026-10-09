// Aroma Qasr — Background Asset Preloader
// Smoothly loads and decodes images in background before revealing the page

(function () {
  const PRELOADER_HTML = `
    <div id="site-preloader" aria-hidden="true">
      <div class="preloader-ambient-glow"></div>
      <div class="preloader-content">
        <div class="preloader-emblem">
          <div class="preloader-emblem-ring"></div>
          <img src="images/AQ-icon.png" alt="Aroma Qasr Emblem" />
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
