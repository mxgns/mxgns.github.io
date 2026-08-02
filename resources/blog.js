(function () {
  var NOTRACK_COOKIE = '_notrack';
  var NOTRACK_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

  function setNotrackCookie() {
    document.cookie = NOTRACK_COOKIE + '=1; max-age=' + NOTRACK_MAX_AGE + '; path=/; SameSite=Lax';
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
