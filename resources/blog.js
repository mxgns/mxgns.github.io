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

  function showBanner(text) {
    var banner = document.getElementById('_ab');
    if (!banner) return;
    banner.textContent = text;
    banner.hidden = false;
  }

  // Applied (and banner shown) before the tracking check below, so a page
  // visited with ?analytics=false isn't counted either.
  var params = new URLSearchParams(location.search);
  var analytics = params.get('analytics');
  if (analytics === 'false') {
    setNotrackCookie();
    showBanner('Analytics have been disabled.');
  } else if (analytics === 'true') {
    removeNotrackCookie();
    showBanner('Analytics have been enabled.');
  }

  var notrack = hasNotrackCookie();

  var notice = document.getElementById('_nt');
  if (notice) notice.hidden = !notrack;

  if (notrack) return;

  var img = document.getElementById('_b');
  if (img) img.src = img.dataset.src;
})();
