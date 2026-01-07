# Cheudaan Academy

A course syllabus explorer with curriculum, videos, and notes.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.

## Deployment to Render

1. **Deploy the entire project** as a single web service on Render.

2. **Environment Variables** (set in Render dashboard):
   ```
   PORT=10000
   API_BASE_URL=https://api.udaanacademy.com.np/api/v1
   API_TOKEN=2737|HHSxop1NRLHUH3rW0Lk1Pr24Re6e8tO1iElBS6Xg6fd828b4
   COURSE_ID=146
   NODE_ENV=production
   PASSWORD=cheudaan123
   ```

3. **Build Command**: (leave empty)

4. **Start Command**: `npm start`

5. **CORS** is configured to allow all origins for deployment.

## Features

- Password-protected access
- Course curriculum explorer
- Video player with YouTube embeds
- Study notes with download links
- Responsive design
- Dynamic course selection

## API Endpoints

- `GET /` - Homepage
- `GET /health` - Health check
- `POST /api/verify-password` - Password verification
- `GET /api/curriculum?courseId=146` - Course curriculum
- `GET /api/videos?courseId=146` - Course videos
- `GET /api/notes?courseId=146` - Course notes
