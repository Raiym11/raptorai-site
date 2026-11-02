/* RaptorAI: общий скрипт для страниц блога - баннер cookie и Яндекс Метрика (после согласия) */
(function () {
  window.loadMetrika = function () {
    if (window.__ymLoaded) { return; }
    window.__ymLoaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=112281876', 'ym');
    ym(112281876, 'init', { ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer', referrer: document.referrer, url: location.href, accurateTrackBounce: true, trackLinks: true });
  };
  function get() { try { return localStorage.getItem('cookie_consent'); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem('cookie_consent', v); } catch (e) {} }
  if (get() === 'yes') { window.loadMetrika(); }

  var css = '#cookie-note{position:fixed;left:16px;bottom:16px;max-width:440px;background:#0F1923;border:1px solid #1E2A36;border-radius:12px;padding:14px 16px;z-index:3500;display:none;box-shadow:0 10px 30px rgba(0,0,0,.5);font-size:13px;line-height:1.5;color:#8899AA}' +
    '#cookie-note a{color:#00D4FF}#cookie-note .cookie-btns{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}' +
    '#cookie-note button{border-radius:8px;padding:8px 18px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}' +
    '#cookie-accept{background:#00D4FF;color:#000;border:none}#cookie-decline{background:transparent;color:#F0F4F8;border:1px solid #1E2A36}' +
    '@media(max-width:520px){#cookie-note{left:10px;right:10px;bottom:10px;max-width:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function init() {
    var n = document.createElement('div');
    n.id = 'cookie-note'; n.setAttribute('role', 'dialog'); n.setAttribute('aria-label', 'Настройки cookie');
    n.innerHTML = 'Мы используем cookie Яндекс Метрики (в том числе запись действий на странице - Вебвизор), чтобы понимать, как посетители пользуются сайтом. Вы можете принять или отказаться - сайт работает в любом случае. Подробнее в <a href="/privacy.html">политике</a>.' +
      '<div class="cookie-btns"><button type="button" id="cookie-accept">Принять</button><button type="button" id="cookie-decline">Отклонить</button></div>';
    document.body.appendChild(n);
    if (!get()) { n.style.display = 'block'; }
    document.getElementById('cookie-accept').addEventListener('click', function () { set('yes'); n.style.display = 'none'; window.loadMetrika(); });
    document.getElementById('cookie-decline').addEventListener('click', function () { set('no'); n.style.display = 'none'; });
    window.openCookieSettings = function (e) { if (e) { e.preventDefault(); } try { localStorage.removeItem('cookie_consent'); } catch (x) {} n.style.display = 'block'; };
    var f = document.getElementById('cookie-settings-link');
    if (f) { f.addEventListener('click', window.openCookieSettings); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
