const STORAGE_KEY = 'fluoxetine-follow-up-v1';

const fields = [
  { key: 'anxiety', label: 'Anxiété — niveau ressenti', short: 'Anxiété' },
  { key: 'sadness', label: 'Humeur triste / pleurs', short: 'Tristesse / pleurs' },
  { key: 'worthlessness', label: 'Dévalorisation / désir de s’excuser', short: 'Dévalorisation' },
  { key: 'concentration', label: 'Difficultés de concentration / Perte de mémoire', short: 'Concentration / mémoire' },
  { key: 'sleep', label: 'Troubles du sommeil', short: 'Sommeil' }
];

let entries = loadEntries();

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function buildSliders() {
  const host = document.getElementById('sliders');
  host.innerHTML = fields.map(field => `
    <div class="slider-row">
      <label for="${field.key}">${field.label}</label>
      <input id="${field.key}" name="${field.key}" type="range" min="0" max="10" step="1" value="0" />
      <output class="score" for="${field.key}">0</output>
    </div>
  `).join('');

  fields.forEach(field => {
    const input = document.getElementById(field.key);
    const output = input.parentElement.querySelector('output');
    input.addEventListener('input', () => { output.value = input.value; output.textContent = input.value; });
  });
}

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}

function renderAll() {
  renderRecent();
  renderTable();
  renderCharts();
}

function renderRecent() {
  const host = document.getElementById('recentEntries');
  if (!entries.length) {
    host.innerHTML = '<p class="empty">Aucune saisie pour le moment.</p>';
    return;
  }
  host.innerHTML = [...entries].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 5).map(entry => {
    const date = new Date(`${entry.date}T12:00:00`);
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
    return `
      <article class="recent-entry">
        <div class="date-badge"><strong>${date.getDate()}</strong><small>${month}</small></div>
        <div><p><strong>Prise à ${entry.time}</strong></p><p class="meta">${entry.physicalEffects || 'Aucun effet physique renseigné'}</p></div>
        <button class="delete-btn" type="button" data-delete="${entry.id}" aria-label="Supprimer cette saisie">✕</button>
      </article>`;
  }).join('');
}

function renderTable() {
  const host = document.getElementById('entriesTable');
  if (!entries.length) {
    host.innerHTML = '<tr><td colspan="9" class="empty">Aucune donnée à afficher.</td></tr>';
    return;
  }
  host.innerHTML = [...entries].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map(entry => `
    <tr>
      <td>${formatDate(entry.date)}</td><td>${entry.time}</td>
      ${fields.map(field => `<td>${entry[field.key]}</td>`).join('')}
      <td>${escapeHtml(entry.physicalEffects || '—')}</td>
      <td><button class="delete-btn" type="button" data-delete="${entry.id}" aria-label="Supprimer">✕</button></td>
    </tr>`).join('');
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function drawLineChart(canvas, field) {
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const sorted = [...entries].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const pad = { left: 30, right: 12, top: 12, bottom: 28 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  ctx.font = '11px system-ui';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#493d5e';
  ctx.fillStyle = '#b0a8bc';
  for (let i = 0; i <= 10; i += 2) {
    const y = pad.top + chartH - (i / 10) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y); ctx.stroke();
    ctx.fillText(String(i), pad.left - 7, y);
  }

  if (!sorted.length) return;
  const points = sorted.map((entry, i) => ({
    x: sorted.length === 1 ? pad.left + chartW / 2 : pad.left + (i / (sorted.length - 1)) * chartW,
    y: pad.top + chartH - (Number(entry[field.key]) / 10) * chartH
  }));

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#b79ae9';
  ctx.lineJoin = 'round';
  ctx.stroke();

  points.forEach((p, i) => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#241d32'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#b79ae9'; ctx.stroke();
  });

  ctx.fillStyle = '#b0a8bc';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const labelIndexes = sorted.length <= 5 ? sorted.map((_, i) => i) : [0, Math.floor((sorted.length - 1) / 2), sorted.length - 1];
  labelIndexes.forEach(i => {
    const d = sorted[i].date;
    ctx.fillText(d.slice(8, 10) + '/' + d.slice(5, 7), points[i].x, height - pad.bottom + 8);
  });
}

function renderCharts() {
  const host = document.getElementById('charts');
  if (!entries.length) {
    host.innerHTML = '<p class="empty card">Ajoutez au moins une saisie pour afficher les graphiques.</p>';
    return;
  }
  host.innerHTML = fields.map(field => `
    <section class="chart-card"><h3>${field.short}</h3><canvas data-chart="${field.key}" aria-label="Graphique ${field.short}"></canvas></section>
  `).join('');
  host.querySelectorAll('canvas').forEach(canvas => {
    const field = fields.find(item => item.key === canvas.dataset.chart);
    drawLineChart(canvas, field);
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function deleteEntry(id) {
  entries = entries.filter(entry => entry.id !== id);
  saveEntries();
  renderAll();
  showToast('Saisie supprimée');
}

buildSliders();
document.getElementById('date').value = localDateString();
document.getElementById('time').value = new Date().toTimeString().slice(0, 5);

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.view + 'View').classList.add('active');
    if (tab.dataset.view === 'graphiques') setTimeout(renderCharts, 30);
  });
}

document.getElementById('entryForm').addEventListener('submit', event => {
  event.preventEvent?.();
  event.preventDefault();
  const form = event.currentTarget;
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: form.date.value,
    time: form.time.value,
    physicalEffects: form.physicalEffects.value.trim()
  };
  fields.forEach(field => { entry[field.key] = Number(document.getElementById(field.key).value); });
  entries.push(entry);
  saveEntries();
  renderAll();
  fields.forEach(field => {
    const input = document.getElementById(field.key);
    input.value = 0;
    input.dispatchEvent(new Event('input'));
  });
  form.physicalEffects.value = '';
  showToast('Saisie ajoutée');
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-delete]');
  if (button) deleteEntry(button.dataset.delete);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!entries.length) return;
  if (confirm('Supprimer toutes les saisies ? Cette action est irréversible.')) {
    entries = [];
    saveEntries();
    renderAll();
    showToast('Toutes les saisies ont été supprimées');
  }
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!entries.length) { showToast('Aucune donnée à exporter'); return; }
  const headers = ['Jour', 'Heure', ...fields.map(f => f.short), 'Effets physiques'];
  const rows = [...entries].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(entry => [
    entry.date, entry.time, ...fields.map(field => entry[field.key]), entry.physicalEffects
  ]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'suivi-fluoxetine.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Export CSV téléchargé');
});

window.addEventListener('resize', () => {
  if (document.getElementById('graphiquesView').classList.contains('active')) renderCharts();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

let deferredInstallPrompt = null;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBanner.classList.add('show');
});

installBtn.addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBanner.classList.remove('show');
  } else {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    showToast(isIos ? 'Safari : Partager puis « Sur l’écran d’accueil »' : 'Menu du navigateur → Ajouter à l’écran d’accueil');
  }
});

window.addEventListener('appinstalled', () => {
  installBanner.classList.remove('show');
  showToast('Application installée');
});

renderAll();
