require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;
const COURSE_ID = process.env.COURSE_ID;
const APP_PASSWORD = process.env.PASSWORD || 'cheudaan123';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

// Password verification endpoint
app.post('/api/verify-password', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.json({ success: false, message: 'Password required' });
  }
  
  if (password === APP_PASSWORD) {
    return res.json({ success: true, message: 'Password verified' });
  } else {
    return res.json({ success: false, message: 'Invalid password' });
  }
});

// Curriculum endpoint
app.get('/api/curriculum', async (req, res) => {
  try {
    const courseId = req.query.courseId || COURSE_ID;
    const curriclumUrl = `${API_BASE_URL}/course/${courseId}/curriculum/`;
    
    console.log(`Fetching from: ${curriclumUrl}`);
    
    const response = await axios.get(curriclumUrl, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching curriculum:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
});

// Videos endpoint
app.get('/api/videos', async (req, res) => {
  try {
    const courseId = req.query.courseId || COURSE_ID;
    const videosUrl = `${API_BASE_URL}/course/${courseId}/media`;
    
    console.log(`Fetching from: ${videosUrl}`);
    
    const response = await axios.get(videosUrl, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      params: {
        type: 'videos',
        page: 1,
        page_size: 3000
      }
    });

    console.log('Videos API Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
});

// Notes endpoint
app.get('/api/notes', async (req, res) => {
  try {
    const courseId = req.query.courseId || COURSE_ID;
    const notesUrl = `${API_BASE_URL}/course/${courseId}/media`;
    
    console.log(`Fetching from: ${notesUrl}`);
    
    const response = await axios.get(notesUrl, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      params: {
        type: 'notes',
        page: 1,
        page_size: 3000
      }
    });

    console.log('Notes API Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching notes:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
});

// Generic proxy endpoint for any API path
app.get('/api/proxy/*', async (req, res) => {
  try {
    const path = req.params[0];
    const proxyUrl = `${API_BASE_URL}/${path}`;
    
    console.log(`Proxying to: ${proxyUrl}`);
    
    const response = await axios.get(proxyUrl, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      params: req.query,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error in proxy request:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.url} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Proxy server running at http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ Curriculum API: http://localhost:${PORT}/api/curriculum`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
});
