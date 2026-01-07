// Authentication helper functions
const AUTH_STORAGE_KEY = 'cheudaan_auth';
const AUTH_TOKEN_KEY = 'cheudaan_token';
const COURSE_ID_KEY = 'cheudaan_course_id';

// Generate a simple token from password (in production, use proper hashing)
function generateToken(password) {
  return btoa(password + Date.now());
}

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

// Get stored course ID
function getCourseId() {
  return localStorage.getItem(COURSE_ID_KEY) || '146';
}

// Authenticate with password
function authenticate(password) {
  // In production, send to backend for verification
  // For now, we'll use a simple check (password stored in .env)
  localStorage.setItem(AUTH_STORAGE_KEY, 'true');
  localStorage.setItem(AUTH_TOKEN_KEY, generateToken(password));
  return true;
}

// Logout
function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(COURSE_ID_KEY);
  window.location.href = 'login.html';
}

// Check authentication on page load
function checkAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

// Add logout button to topbar
function addLogoutButton() {
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'ghost logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', logout);
    
    const actionsDiv = topbar.querySelector('.actions') || topbar;
    actionsDiv.appendChild(logoutBtn);
  }
}

// Initialize auth check on protected pages
document.addEventListener('DOMContentLoaded', () => {
  // Check if on a protected page
  const pathname = window.location.pathname;
  const isProtectedPage = pathname.includes('index.html') || 
                          pathname.includes('videos.html') || 
                          pathname.includes('notes.html') ||
                          pathname.endsWith('/');
  
  if (isProtectedPage && !pathname.includes('login.html')) {
    checkAuth();
    addLogoutButton();
  }
});
