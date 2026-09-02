(async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  const loading = document.getElementById('state-loading');
  const denied = document.getElementById('state-denied');
  const ok = document.getElementById('state-ok');

  function show(el) {
    loading.style.display = 'none';
    denied.style.display = 'none';
    ok.style.display = 'none';
    el.style.display = 'block';
  }

  if (!sessionId) {
    show(denied);
    return;
  }

  try {
    const res = await fetch('/.netlify/functions/verify-session?session_id=' + encodeURIComponent(sessionId));
    const data = await res.json();

    if (res.ok && data.paid) {
      show(ok);
    } else {
      show(denied);
    }
  } catch (err) {
    console.error(err);
    show(denied);
  }
})();
