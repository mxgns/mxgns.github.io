(function () {
  var NOTRACK_COOKIE = '_notrack';
  var NOTRACK_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

  function setNotrackCookieFromUrl() {
    var params = new URLSearchParams(location.search);
    if (!params.has('notrack')) return;
    document.cookie = NOTRACK_COOKIE + '=1; max-age=' + NOTRACK_MAX_AGE + '; path=/; SameSite=Lax';
  }

  function hasNotrackCookie() {
    return new RegExp('(?:^|; )' + NOTRACK_COOKIE + '=').test(document.cookie);
  }

  // Set before checking, so a page visited with ?notrack isn't counted either.
  setNotrackCookieFromUrl();

  if (hasNotrackCookie()) return;

  var img = document.getElementById('_b');
  if (img) img.src = img.dataset.src;
})();
