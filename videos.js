const VIDEO_API = 'http://localhost:3000/api/videos';

const listEl = document.getElementById('video-list');
const detailEl = document.getElementById('video-detail');
const statusEl = document.getElementById('status');
const reloadBtn = document.getElementById('reload-videos');
const mobileMedia = window.matchMedia('(max-width: 900px)');
let videos = [];
let activeBtn = null;
let inlineContainer = null;
let currentVideo = null;

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

function toYoutubeEmbed(url) {
  if (typeof url !== 'string') return '';
  const match = url.match(/(?:youtu\.be\/|v=|\/embed\/)([\w-]{11})/);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?rel=0` : url;
}

async function fetchVideos() {
  setStatus('Loading videos...');
  listEl.innerHTML = '<p class="muted">Loading...</p>';
  if (detailEl) detailEl.innerHTML = '<p class="muted">Loading...</p>';
  clearInlinePlayer();
  try {
    const courseId = getCourseIdFromStorage();
    const url = `${VIDEO_API}?courseId=${courseId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed with ${res.status}`);
    const json = await res.json();
    videos = Array.isArray(json.data.data) ? json.data.data : [];
    renderList();
    if (!videos.length) {
      if (detailEl) detailEl.innerHTML = '<p class="muted">No videos found.</p>';
      setStatus('No videos.');
      return;
    }
    const firstBtn = listEl.querySelector('.video-btn');
    if (firstBtn) {
      firstBtn.classList.add('active');
      activeBtn = firstBtn;
      renderPlayer(videos[0], firstBtn);
    }
    setStatus(`Loaded ${videos.length} videos.`);
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<p class="muted">Unable to load videos.</p>';
    if (detailEl) detailEl.innerHTML = '<p class="muted">No video selected.</p>';
    setStatus('Load failed.');
  }
}

function renderList() {
  if (!videos.length) {
    listEl.innerHTML = '<p class="muted">No videos available.</p>';
    return;
  }
  listEl.innerHTML = '';
  videos.forEach((vid) => {
    const btn = document.createElement('button');
    btn.className = 'unit-btn video-btn';
    btn.innerHTML = `
      <span class="video-title">${escapeHtml(vid.file_name || vid.name || 'Untitled')}</span>
      <span class="muted small">${escapeHtml(vid.created_at || '')}</span>
    `;
    btn.addEventListener('click', () => {
      if (activeBtn) activeBtn.classList.remove('active');
      btn.classList.add('active');
      activeBtn = btn;
      renderPlayer(vid, btn);
    });
    listEl.appendChild(btn);
  });
}

function renderPlayer(vid, targetBtn = activeBtn) {
  currentVideo = vid;
  const markup = buildPlayerMarkup(vid);
  if (detailEl) detailEl.innerHTML = markup;
  renderInlinePlacement(markup, targetBtn);
}

function buildPlayerMarkup(vid) {
  const title = escapeHtml(vid.file_name || vid.name || 'Video');
  const desc = escapeHtml(vid.description || '');
  const src = toYoutubeEmbed(vid.url || vid.video_file_path || '');
  return src
    ? `
        <div class="player">
          <iframe
            src="${src}"
            title="${title}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
        <h3>${title}</h3>
        <p class="muted">${escapeHtml(vid.created_at || '')}</p>
        <p>${desc || 'No description provided.'}</p>
      `
    : '<p class="muted">No video URL.</p>';
}

function renderInlinePlacement(markup, targetBtn = activeBtn) {
  if (!targetBtn) return;
  ensureInlineContainer();
  inlineContainer.innerHTML = markup;
  targetBtn.insertAdjacentElement('afterend', inlineContainer);
  inlineContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ensureInlineContainer() {
  if (inlineContainer) return;
  inlineContainer = document.createElement('div');
  inlineContainer.className = 'inline-player';
}

function clearInlinePlayer() {
  if (inlineContainer && inlineContainer.parentNode) {
    inlineContainer.parentNode.removeChild(inlineContainer);
  }
  inlineContainer = null;
}

function setStatus(text) {
  statusEl.textContent = text;
}

reloadBtn.addEventListener('click', fetchVideos);

mobileMedia.addEventListener('change', () => {
  if (currentVideo) {
    renderInlinePlacement(buildPlayerMarkup(currentVideo), activeBtn);
  }
});

fetchVideos();
