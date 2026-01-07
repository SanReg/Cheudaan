const API_URL = 'http://localhost:3000/api/curriculum';
const TOKEN = '2737|HHSxop1NRLHUH3rW0Lk1Pr24Re6e8tO1iElBS6Xg6fd828b4';

const chaptersContainer = document.getElementById('chapters');
const statusEl = document.getElementById('status');
const detailEl = document.getElementById('unit-detail');
const reloadBtn = document.getElementById('reload');
const searchInput = document.getElementById('search');
const mobileMedia = window.matchMedia('(max-width: 900px)');
let activeUnitBtn = null;
let syllabusData = [];
let currentFilter = '';
let inlineDetail = null;
let currentDetailPayload = null;

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

// Turn YouTube URLs into clickable links while escaping the rest of the text.
function linkifyYoutube(text) {
  if (typeof text !== 'string') return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const re = /(https?:\/\/[^\s]*?(?:youtube\.com\/[\w\-?=&%.#]+|youtu\.be\/[\w\-?=&%.#]+))/gi;
  return escaped.replace(re, (url) => `
    <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
  `);
}

function toYoutubeEmbed(url) {
  if (typeof url !== 'string') return '';
  try {
    const ytMatch = url.match(/(?:youtu\.be\/|v=|\/embed\/)([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    }
    return url;
  } catch (e) {
    return '';
  }
}

async function fetchSyllabus() {
  setStatus('Loading syllabus...');
  chaptersContainer.innerHTML = '';
  if (detailEl) detailEl.innerHTML = '<p class="muted">Loading...</p>';

  try {
    const courseId = getCourseIdFromStorage();
    const url = `${API_URL}?courseId=${courseId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const json = await response.json();
    console.log('API Response:', json);
    syllabusData = Array.isArray(json.data?.data) ? json.data.data : [];

    if (!syllabusData.length) {
      setStatus('No data returned.');
      chaptersContainer.innerHTML = '<p class="muted">No chapters available.</p>';
      if (detailEl) detailEl.innerHTML = '<p class="muted">No unit selected.</p>';
      return;
    }

    renderChapters();
    setStatus(`Loaded ${syllabusData[0].chapters?.length || 0} chapters.`);
    if (detailEl) detailEl.innerHTML = '<p class="muted">Select a unit to view metadata.</p>';
  } catch (error) {
    console.error(error);
    setStatus('Unable to load data.');
    chaptersContainer.innerHTML = '<p class="muted">Check the network or token and try again.</p>';
    if (detailEl) detailEl.innerHTML = '<p class="muted">No unit selected.</p>';
  }
}

function renderChapters(courses) {
  const coursesToRender = courses || syllabusData;
  const term = currentFilter.trim().toLowerCase();
  chaptersContainer.innerHTML = '';

  coursesToRender.forEach((course, courseIndex) => {
    const courseLabel = course.name || 'Course';
    (course.chapters || []).forEach((chapter, idx) => {
      const units = chapter.units || [];

      const filteredUnits = !term
        ? units
        : units.filter((unit) => {
            const nameHit = (unit.name || '').toLowerCase().includes(term);
            const descHit = (unit.description || '').toLowerCase().includes(term);
            const lessonHit = Array.isArray(unit.lessons)
              ? unit.lessons.some((l) => (l.name || '').toLowerCase().includes(term))
              : false;
            return nameHit || descHit || lessonHit;
          });

      const chapterMatch = !term || (chapter.name || '').toLowerCase().includes(term);
      const shouldRenderChapter = chapterMatch || filteredUnits.length;
      if (!shouldRenderChapter) return;

      const card = document.createElement('article');
      card.className = 'chapter-card';

      const header = document.createElement('div');
      header.className = 'chapter-header';
      header.dataset.open = 'false';

      const meta = document.createElement('div');
      meta.className = 'chapter-meta';

      const title = document.createElement('strong');
      title.textContent = chapter.name || `Chapter ${idx + 1}`;

      const subtitle = document.createElement('span');
      subtitle.className = 'muted';
      subtitle.textContent = courseLabel;

      meta.appendChild(title);
      meta.appendChild(subtitle);

      const badge = document.createElement('span');
      badge.className = 'badge';
      const unitCount = units.length;
      const showCount = term ? filteredUnits.length : unitCount;
      badge.textContent = `${showCount} unit${showCount === 1 ? '' : 's'}`;

      header.appendChild(meta);
      header.appendChild(badge);

      const unitsWrap = document.createElement('div');
      unitsWrap.className = 'units';
      unitsWrap.style.display = 'none';

      const toRenderUnits = term ? filteredUnits : units;

      if (!toRenderUnits.length) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = 'No units in this chapter.';
        unitsWrap.appendChild(empty);
      } else {
        toRenderUnits.forEach((unit) => {
          const btn = document.createElement('button');
          btn.className = 'unit-btn';
          btn.textContent = unit.name || 'Untitled unit';
          btn.addEventListener('click', () => {
            if (activeUnitBtn) {
              activeUnitBtn.classList.remove('active');
            }
            btn.classList.add('active');
            activeUnitBtn = btn;
            renderUnitDetail(unit, chapter, courseLabel, btn);
          });
          unitsWrap.appendChild(btn);
        });
      }

      card.appendChild(header);
      card.appendChild(unitsWrap);
      chaptersContainer.appendChild(card);

      const shouldDefaultOpen = term || (courseIndex === 0 && idx === 0);
      if (shouldDefaultOpen) {
        header.dataset.open = 'true';
        unitsWrap.style.display = 'grid';
      }

      header.addEventListener('click', () => {
        const isOpen = header.dataset.open === 'true';
        header.dataset.open = isOpen ? 'false' : 'true';
        unitsWrap.style.display = isOpen ? 'none' : 'grid';
      });
    });
  });

  if (!chaptersContainer.children.length) {
    chaptersContainer.innerHTML = '<p class="muted">No matches. Try a different search.</p>';
  }
}

function renderUnitDetail(unit, chapter, courseLabel, targetBtn = activeUnitBtn) {
  const audio = unit.audio_count ?? 0;
  const video = unit.video_count ?? 0;
  const pdf = unit.pdf_count ?? 0;
  const other = unit.other_lesson_count ?? 0;
  const lessons = unit.lessons;
  const descriptionMarkup = linkifyYoutube(unit.description || 'No description provided.');
  const lessonItems = Array.isArray(lessons) ? lessons : [];
  const videoLessons = lessonItems.filter((l) => l && l.media && l.media.length > 0);
  const firstVideo = videoLessons[0];

  const counts = `Audio: ${audio}, Video: ${video}, PDF: ${pdf}, Other: ${other}`;

  currentDetailPayload = { unit, chapterName: chapter.name || 'Chapter', courseLabel };
  const markup = buildDetailMarkup({
    unit,
    chapterName: chapter.name || 'Chapter',
    courseLabel,
    firstVideo,
    lessons: lessonItems,
    descriptionMarkup,
    counts,
  });

  if (detailEl) {
    detailEl.innerHTML = markup;
    wireLessonLinks(detailEl);
  }
  renderInlineDetail(markup, targetBtn);
  setStatus(counts);
}

function buildDetailMarkup({ unit, chapterName, courseLabel, firstVideo, lessons, descriptionMarkup, counts }) {
  const audio = unit.audio_count ?? 0;
  const video = unit.video_count ?? 0;
  const pdf = unit.pdf_count ?? 0;
  const other = unit.other_lesson_count ?? 0;

  const lessonsMarkup = (() => {
    if (lessons && lessons.length) {
      return `<ul class="lesson-list">${lessons
        .map((item, idx) => {
          const safeName = escapeHtml(item?.name || `Lesson ${idx + 1}`);
          const safeDesc = escapeHtml(item?.description || '');
          const videoUrl = item?.media?.[0]?.url || '';
          const hasVideo = Boolean(videoUrl);
          const linkAttrs = hasVideo ? `data-video="${videoUrl}"` : '';
          const pill = hasVideo ? '<span class="pill">Video</span>' : '';
          const descBlock = safeDesc ? `<p class="lesson-desc muted">${safeDesc}</p>` : '';
          return `<li>
              <button class="lesson-link" ${linkAttrs}>${safeName} ${pill}</button>
              ${descBlock}
            </li>`;
        })
        .join('')}</ul>`;
    }
    if (typeof unit.lessons === 'string' && unit.lessons.trim()) {
      return `<div class="lesson-block">${linkifyYoutube(unit.lessons)}</div>`;
    }
    return '<p class="muted">No lessons listed.</p>';
  })();

  const firstVideoUrl = firstVideo?.media?.[0]?.url || '';
  const playerMarkup = firstVideoUrl
    ? `<div class="player">
        <iframe
          class="video-frame"
          src="${toYoutubeEmbed(firstVideoUrl)}"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>`
    : '<p class="muted">No video to play.</p>';

  return `
    <h3>${unit.name || 'Unit'}</h3>
    <p class="muted">${chapterName} · ${courseLabel}</p>
    <div class="counts">
      <span class="count">Audio ${audio}</span>
      <span class="count">Video ${video}</span>
      <span class="count">PDF ${pdf}</span>
      <span class="count">Other ${other}</span>
    </div>
    <p>${descriptionMarkup}</p>
    ${playerMarkup}
    <p class="muted">Lessons:</p>
    ${lessonsMarkup}
  `;
}

function wireLessonLinks(container) {
  const frame = container.querySelector('.video-frame');
  if (!frame) return;

  const links = Array.from(container.querySelectorAll('.lesson-link'));
  links.forEach((btn) => {
    const videoUrl = btn.getAttribute('data-video');
    if (!videoUrl) return;
    btn.addEventListener('click', () => {
      links.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      frame.src = toYoutubeEmbed(videoUrl);
    });
  });

  const firstLink = links.find((btn) => btn.getAttribute('data-video'));
  if (firstLink) {
    firstLink.classList.add('active');
  }
}

function renderInlineDetail(markup, targetBtn = activeUnitBtn) {
  if (!targetBtn) return;
  ensureInlineDetail();
  inlineDetail.innerHTML = markup;
  targetBtn.insertAdjacentElement('afterend', inlineDetail);
  wireLessonLinks(inlineDetail);
  inlineDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ensureInlineDetail() {
  if (inlineDetail) return;
  inlineDetail = document.createElement('div');
  inlineDetail.className = 'inline-detail detail-body';
}

function clearInlineDetail() {
  if (inlineDetail && inlineDetail.parentNode) {
    inlineDetail.parentNode.removeChild(inlineDetail);
  }
  inlineDetail = null;
}

function setStatus(text) {
  statusEl.textContent = text;
}

reloadBtn.addEventListener('click', fetchSyllabus);
searchInput?.addEventListener('input', (e) => {
  currentFilter = e.target.value || '';
  renderChapters();
});

mobileMedia.addEventListener('change', () => {
  if (currentDetailPayload && activeUnitBtn) {
    const { unit, chapterName, courseLabel } = currentDetailPayload;
    const lessons = Array.isArray(unit.lessons) ? unit.lessons : [];
    const videoLessons = lessons.filter((l) => l && l.media && l.media.length > 0);
    const firstVideo = videoLessons[0];
    const descriptionMarkup = linkifyYoutube(unit.description || 'No description provided.');
    const counts = `Audio: ${unit.audio_count ?? 0}, Video: ${unit.video_count ?? 0}, PDF: ${unit.pdf_count ?? 0}, Other: ${unit.other_lesson_count ?? 0}`;
    const markup = buildDetailMarkup({ unit, chapterName, courseLabel, firstVideo, lessons, descriptionMarkup, counts });
    renderInlineDetail(markup, activeUnitBtn);
  }
});

fetchSyllabus();
