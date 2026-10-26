const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function getSession() {
  return chrome.storage.session.get(['token', 'server', 'name', 'pendingText']);
}

function showError(msg) {
  $('error').textContent = msg || '';
}

async function render() {
  const s = await getSession();
  const loggedIn = Boolean(s.token);
  $('login').classList.toggle('hidden', loggedIn);
  $('check').classList.toggle('hidden', !loggedIn);
  if (loggedIn) {
    $('who').textContent = s.name || 'your account';
    if (s.pendingText) {
      $('text').value = s.pendingText;
      await chrome.storage.session.remove('pendingText');
      chrome.action.setBadgeText({ text: '' });
    }
  }
}

$('loginBtn').addEventListener('click', async () => {
  showError('');
  const server = $('server').value;
  try {
    const res = await fetch(`${server}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: $('identifier').value.trim(), passcode: $('passcode').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || `Sign-in failed (HTTP ${res.status})`);
    await chrome.storage.session.set({ token: data.access_token, server, name: data.user?.full_name || data.full_name || '' });
    $('passcode').value = '';
    render();
  } catch (e) {
    showError(e.message);
  }
});

$('logoutBtn').addEventListener('click', async () => {
  await chrome.storage.session.remove(['token', 'name']);
  $('result').innerHTML = '';
  render();
});

$('checkBtn').addEventListener('click', async () => {
  showError('');
  const text = $('text').value.trim();
  if (text.length < 5) return showError('Enter at least 5 characters.');
  const { token, server } = await getSession();
  $('checkBtn').disabled = true;
  try {
    const res = await fetch(`${server}/api/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ text, channel: 'BROWSER' }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      await chrome.storage.session.remove(['token']);
      render();
      throw new Error('Session expired. Please sign in again.');
    }
    if (!res.ok) throw new Error(data.detail || data.message || `Check failed (HTTP ${res.status})`);
    const signals = (data.detected_signals || []).slice(0, 4).map((s) => `<li>${escapeHtml(s.reason)}</li>`).join('');
    const actions = (data.recommended_actions || []).slice(0, 3).map((a) => `<li>${escapeHtml(a)}</li>`).join('');
    $('result').innerHTML = `
      <div class="result ${escapeHtml(data.risk_level)}">
        <strong>${escapeHtml(data.risk_level)} risk</strong> · ${escapeHtml(data.verdict)}
        <p>${escapeHtml(data.plain_language_summary)}</p>
        ${signals ? `<b>Why</b><ul>${signals}</ul>` : ''}
        ${actions ? `<b>Do now</b><ul>${actions}</ul>` : ''}
        <p class="muted">Engine: ${escapeHtml(data.ai_provider === 'none' ? 'local rule engine' : data.ai_provider)}.
        A low-risk result is not proof of safety. If money was sent, call 1930.</p>
      </div>`;
  } catch (e) {
    showError(e.message);
  } finally {
    $('checkBtn').disabled = false;
  }
});

render();
