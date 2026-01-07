const NOTES_API = 'http://localhost:3000/api/notes';

const listEl = document.getElementById('notes-list');
const detailEl = document.getElementById('notes-detail');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('search-notes');
let notes = [];
let filteredNotes = [];
let activeBtn = null;
let currentNote = null;

// Get course ID from localStorage
function getCourseIdFromStorage() {
  return localStorage.getItem('cheudaan_course_id') || '146';
}

function escapeHtml(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

async function fetchNotes() {
  setStatus('Loading notes...');
  listEl.innerHTML = '<p class="muted">Loading...</p>';
  if (detailEl) detailEl.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const courseId = getCourseIdFromStorage();
    const url = `${NOTES_API}?courseId=${courseId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed with ${res.status}`);

    const json = await res.json();
    notes = Array.isArray(json.data.data) ? json.data.data : [];
    filteredNotes = [...notes];
    renderList();
    if (!notes.length) {
      if (detailEl) detailEl.innerHTML = '<p class="muted">No notes found.</p>';
      setStatus('No notes.');
      return;
    }
    const firstBtn = listEl.querySelector('.note-btn');
    if (firstBtn) {
      firstBtn.classList.add('active');
      activeBtn = firstBtn;
      renderDetail(notes[0], firstBtn);
    }
    setStatus(`Loaded ${notes.length} notes.`);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<p class="muted">Unable to load notes.</p>';
    if (detailEl) detailEl.innerHTML = '<p class="muted">No note selected.</p>';
    setStatus('Load failed.');
  }
}

function renderList() {
  if (!filteredNotes.length) {
    listEl.innerHTML = '<p class="muted">No notes available.</p>';
    return;
  }
  listEl.innerHTML = '';
  filteredNotes.forEach((note) => {
    const btn = document.createElement('button');
    btn.className = 'unit-btn note-btn';
    btn.innerHTML = `
      <div class="note-list-item">
        <span class="note-title">${escapeHtml(note.file_name || 'Untitled')}</span>
        <span class="note-size muted">${formatFileSize(note.size)}</span>
      </div>
    `;
    btn.addEventListener('click', () => {
      if (activeBtn) activeBtn.classList.remove('active');
      btn.classList.add('active');
      activeBtn = btn;
      renderDetail(note, btn);
    });
    listEl.appendChild(btn);
  });
}

function renderDetail(note, targetBtn = activeBtn) {
  currentNote = note;
  const markup = buildDetailMarkup(note);
  if (detailEl) detailEl.innerHTML = markup;
}

function buildDetailMarkup(note) {
  const title = escapeHtml(note.file_name || 'Note');
  const url = escapeHtml(note.url || '');
  const size = formatFileSize(note.size);
  const type = escapeHtml(note.type || '');
  
  let content = `<div class="note-detail">`;
  content += `<div class="note-header">`;
  content += `<h3>${title}</h3>`;
  content += `<span class="note-badge">${type}</span>`;
  content += `</div>`;
  
  content += `<div class="note-info">`;
  content += `<div class="info-row">
    <span class="info-label">File Size:</span>
    <span class="info-value">${size}</span>
  </div>`;
  
  if (url) {
    content += `<div class="info-row">
      <span class="info-label">URL:</span>
      <span class="info-value"><a href="${url}" target="_blank">View Link</a></span>
    </div>`;
  }
  
  content += `</div>`;
  
  if (url) {
    content += `<div class="note-actions">
      <a href="${url}" download class="btn btn-primary">⬇ Download PDF</a>
      <a href="${url}" target="_blank" class="btn btn-secondary">🔗 Open in Browser</a>
    </div>`;
  }
  
  content += `</div>`;
  return content;
}

function handleSearch() {
  const query = searchInput.value.toLowerCase();
  if (!query) {
    filteredNotes = [...notes];
  } else {
    filteredNotes = notes.filter(note => {
      const name = (note.file_name || '').toLowerCase();
      return name.includes(query);
    });
  }
  renderList();
  if (detailEl && !filteredNotes.length) {
    detailEl.innerHTML = '<p class="muted">No matching notes found.</p>';
  }
}

searchInput.addEventListener('input', handleSearch);

// Load notes on page load
document.addEventListener('DOMContentLoaded', fetchNotes);
