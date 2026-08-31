(function () {
  var NOTRACK_COOKIE = '_notrack';
  var NOTRACK_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

  function setNotrackCookie() {
    document.cookie = NOTRACK_COOKIE + '=1; max-age=' + NOTRACK_MAX_AGE + '; path=/; SameSite=Lax';
    // Right to object: delete whatever's already been recorded for this
    // visitor today. No opt-out state is kept server-side — the cookie
    // above is what stops the beacon firing again — so this is a one-time
    // cleanup, not something to call again when un-opting-out below.
    fetch('/api/track/object', { keepalive: true }).catch(function () {});
  }

  function removeNotrackCookie() {
    document.cookie = NOTRACK_COOKIE + '=; max-age=0; path=/; SameSite=Lax';
  }

  function hasNotrackCookie() {
    return new RegExp('(?:^|; )' + NOTRACK_COOKIE + '=').test(document.cookie);
  }

  function urlWithAnalytics(value) {
    var params = new URLSearchParams(location.search);
    params.set('analytics', value);
    return location.pathname + '?' + params.toString() + location.hash;
  }

  function urlWithoutSrc() {
    var params = new URLSearchParams(location.search);
    params.delete('src');
    var qs = params.toString();
    return location.pathname + (qs ? '?' + qs : '') + location.hash;
  }

  function showBanner(text, stateClass, undoHref) {
    var banner = document.getElementById('_ab');
    if (!banner) return;
    banner.textContent = '';
    banner.classList.remove('enabled', 'disabled');
    banner.classList.add(stateClass);

    var message = document.createElement('span');
    message.textContent = text;
    banner.appendChild(message);

    var undo = document.createElement('a');
    undo.className = 'analytics-banner-undo';
    undo.href = undoHref;
    undo.textContent = 'Undo';
    banner.appendChild(undo);

    banner.hidden = false;
  }

  // Applied (and banner shown) before the tracking check below, so a page
  // visited with ?analytics=false isn't counted either.
  var params = new URLSearchParams(location.search);
  var analytics = params.get('analytics');
  if (analytics === 'false') {
    setNotrackCookie();
    showBanner('Analytics have been disabled.', 'disabled', urlWithAnalytics('true'));
  } else if (analytics === 'true') {
    removeNotrackCookie();
    showBanner('Analytics have been enabled.', 'enabled', urlWithAnalytics('false'));
  }

  // Removed from the address bar unconditionally (even if tracking is
  // disabled below) so a ?src= link never ends up bookmarked with the
  // parameter attached.
  var src = params.get('src');
  if (src) history.replaceState(null, '', urlWithoutSrc());

  var notrack = hasNotrackCookie();

  var notice = document.getElementById('_nt');
  if (notice) notice.hidden = !notrack;

  if (notrack) return;

  var img = document.getElementById('_b');
  if (img) {
    var pixelSrc = img.dataset.src;
    if (src) {
      var pixelParams = new URLSearchParams();
      pixelParams.set('src', src);
      pixelSrc += '?' + pixelParams.toString();
    }
    img.src = pixelSrc;
  }
})();

// Separate IIFE: unrelated to analytics, and the block above returns early
// when tracking is opted out, which must not disable the theme toggle.
(function () {
  var STORAGE_KEY = 'theme';

  function getStoredTheme() {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function effectiveTheme() {
    var stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateLabel() {
    toggle.setAttribute('aria-label', effectiveTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  var toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  // Only written on click: leaving data-theme unset until then means the
  // page keeps following prefers-color-scheme live for anyone who hasn't
  // made an explicit choice this session.
  toggle.addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', next);
    updateLabel();
  });

  updateLabel();
})();

// Separate IIFE: gallery masonry layout + load-more, unrelated to
// analytics/theme, and a no-op on every page except gallery.html/gallery-N.html.
(function () {
  var gallery = document.getElementById('gallery');
  if (!gallery) return;

  var msnry = null;
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/masonry-layout@4/dist/masonry.pkgd.min.js';
  script.onload = function () {
    msnry = new Masonry(gallery, { itemSelector: '.gallery-item', percentPosition: true });
  };
  document.head.appendChild(script);

  // A continuous, ever-growing photo stream doesn't have a meaningful "go
  // back to newer photos" step once older pages are loaded in below it.
  var newer = document.querySelector('.newer');
  if (newer) newer.hidden = true;

  var link = document.querySelector('.load-more');
  if (!link) return;

  var li = link.closest('li');
  link.textContent = 'Load more';
  link.classList.add('load-more-button');
  if (li) li.classList.add('load-more-li');

  link.addEventListener('click', function (event) {
    event.preventDefault();
    if (link.classList.contains('is-loading')) return;
    link.classList.add('is-loading');
    link.setAttribute('aria-disabled', 'true');

    fetch(link.href).then(function (response) {
      if (!response.ok) throw new Error(response.status);
      return response.text();
    }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var items = Array.prototype.slice.call(doc.querySelectorAll('#gallery > li'));
      items.forEach(function (item) { gallery.appendChild(item); });

      if (msnry) {
        msnry.appended(items);
        msnry.layout();
      }

      var next = doc.querySelector('.load-more');
      if (next) {
        link.href = next.getAttribute('href');
      } else if (li) {
        li.remove();
      } else {
        link.remove();
      }
    }).catch(function () {
      window.location.href = link.href;
    }).finally(function () {
      link.classList.remove('is-loading');
      link.removeAttribute('aria-disabled');
    });
  });
})();
