(function () {
  var form = document.getElementById('search-form');
  var input = document.getElementById('search-input');
  var clearBtn = document.getElementById('search-clear');
  var statusEl = document.getElementById('search-status');
  var resultsEl = document.getElementById('search-results');
  if (!form || !input || !clearBtn || !statusEl || !resultsEl) return;

  // Pagefind's fuzzy ranking returns a scored result for almost any input —
  // a garbled, no-match query still comes back with dozens of near-zero
  // relevance hits rather than an empty list. A floor on .score is the only
  // way to get the spec's "deliberately sparse" zero-results state back for
  // genuine non-matches, at the cost of very common one-word queries (e.g.
  // "the") legitimately returning fewer/no results too.
  var MIN_RELEVANCE_SCORE = 5;

  var pagefind = null;
  var pagefindReady = import('/pagefind/pagefind.js').then(function (module) {
    pagefind = module;
  });

  function isCoarsePointer() {
    return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  }

  function currentQuery() {
    return new URLSearchParams(location.search).get('q') || '';
  }

  function renderZeroState(query) {
    statusEl.textContent = 'No results for “' + query + '”';
    resultsEl.replaceChildren();
    var tryAnother = document.createElement('p');
    tryAnother.className = 'search-try-another';
    tryAnother.textContent = 'Try another search.';
    resultsEl.appendChild(tryAnother);
  }

  function renderResults(results, query) {
    statusEl.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '') + ' for “' + query + '”';
    resultsEl.replaceChildren();
    var list = document.createElement('div');
    list.className = 'search-result-list';
    results.forEach(function (result) {
      var article = document.createElement('article');
      article.className = 'search-result';

      var heading = document.createElement('h2');
      var link = document.createElement('a');
      link.href = result.url;
      link.textContent = result.meta.title || '';
      heading.appendChild(link);
      article.appendChild(heading);

      var body = document.createElement('div');
      body.className = 'post-body';
      var excerpt = document.createElement('p');
      excerpt.innerHTML = result.excerpt;
      body.appendChild(excerpt);
      article.appendChild(body);

      if (result.meta.date) {
        var time = document.createElement('time');
        time.textContent = result.meta.date;
        article.appendChild(time);
      }

      list.appendChild(article);
    });
    resultsEl.appendChild(list);
  }

  function showInitialState() {
    input.value = '';
    clearBtn.hidden = true;
    statusEl.textContent = '';
    resultsEl.replaceChildren();
    if (!isCoarsePointer()) input.focus();
  }

  function runSearch(query) {
    clearBtn.hidden = false;
    statusEl.textContent = 'Searching…';
    resultsEl.replaceChildren();

    pagefindReady.then(function () {
      return pagefind.search(query);
    }).then(function (search) {
      var relevant = search.results.filter(function (result) {
        return result.score >= MIN_RELEVANCE_SCORE;
      });
      return Promise.all(relevant.map(function (result) {
        return result.data();
      }));
    }).then(function (results) {
      // Ignore a stale response if the query changed while this was in flight.
      if (currentQuery() !== query) return;
      if (results.length === 0) {
        renderZeroState(query);
      } else {
        renderResults(results, query);
      }
    });
  }

  function applyStateFromUrl() {
    var query = currentQuery();
    if (!query) {
      showInitialState();
      return;
    }
    input.value = query;
    clearBtn.hidden = false;
    runSearch(query);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var query = input.value.trim();
    var url = query ? '?q=' + encodeURIComponent(query) : location.pathname;
    history.pushState(null, '', url);
    applyStateFromUrl();
  });

  clearBtn.addEventListener('click', function () {
    history.pushState(null, '', location.pathname);
    showInitialState();
  });

  window.addEventListener('popstate', applyStateFromUrl);

  applyStateFromUrl();
})();
