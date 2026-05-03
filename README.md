# 🚀 AI Resume Matcher

![AI Resume Matcher](https://img.shields.io/badge/Status-Live-success) ![Node.js](https://img.shields.io/badge/Backend-Node.js-339933) ![React](https://img.shields.io/badge/Frontend-React-61DAFB) ![OpenAI](https://img.shields.io/badge/AI-OpenAI-412991) ![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748)

A production-grade, industry-agnostic recruitment engine that intelligently scores and ranks candidate resumes against Job Descriptions (JDs) using advanced AI semantic matching and OCR technology.

🌍 **Live Demo:** [https://resume-matcher-frontend-taupe.vercel.app/](https://resume-matcher-frontend-taupe.vercel.app/)

---

## ✨ Key Features

- 🧠 **Semantic AI Matching:** Uses OpenAI embeddings (`text-embedding-3-small`) to calculate true semantic similarity (Cosine Distance) between a candidate's experience and the job requirements, moving beyond simple keyword matching.
- 📄 **Two-Tier PDF Extraction:**
  - **Primary:** Blazing fast text extraction for standard digital PDFs using `pdf-parse`.
  - **Fallback (OCR):** Automatically detects scanned/image-based resumes and utilizes `poppler-utils` + OpenAI Vision (`gpt-4o-mini`) to extract multi-column text with high accuracy.
- 🎯 **Deterministic Scoring:** Combines AI flexibility with hard-coded logic. Utilizes dynamic weighting (prioritizing skills for juniors, balancing experience for seniors) and a Sub-Skill enforcement map (e.g., matching "React" automatically credits "HTML/CSS").
- ⚡ **High-Performance Batching:** Architecture optimized to process 100+ resumes simultaneously without hitting API rate limits or context window bounds by intelligently chunking concurrent database and AI calls.
- 🎨 **Premium UI/UX:** A responsive, dark-mode-first dashboard built with React and Tailwind CSS, featuring rich micro-animations and intuitive workflows.
- 🔐 **Secure Auth:** Powered by Firebase Authentication and secured by JWT middleware on the backend.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework:** React.js powered by Vite
- **Styling:** Tailwind CSS (Vanilla CSS structure for dynamic components)
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Auth & Storage:** Firebase Auth & Firebase Storage

### Backend (`/server`)
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **AI Integration:** OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`)
- **System Dependencies:** `poppler-utils` (for PDF-to-Image OCR conversion)

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL running locally or remotely
- `poppler-utils` installed on your machine (`sudo apt-get install poppler-utils` on Linux, `brew install poppler` on macOS).

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <repo-directory>
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/resume_matcher?schema=public"
OPENAI_API_KEY="your_openai_api_key_here"
PORT=5000
FIREBASE_SERVICE_ACCOUNT_JSON='{ "type": "service_account", "project_id": "...", ... }'
```
*Note: You can also use `FIREBASE_SERVICE_ACCOUNT_PATH="./serviceAccountKey.json"` if testing locally.*

Run Database Migrations and start the server:
```bash
npx prisma db push
npx prisma generate
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd client
npm install
```
Ensure your Firebase configuration in `client/src/services/firebase.js` is correct.

Start the frontend server:
```bash
npm run dev
```
The app will be running at `http://localhost:5173`.

---

## 📦 Deployment Architecture

- **Frontend:** Hosted on [Vercel](https://vercel.com).
- **Backend:** Hosted on a Dockerized platform (e.g., Render) to support the OS-level `poppler-utils` dependency required for the OCR pipeline.
- **Database:** PostgreSQL hosted via Supabase / Neon.

### Docker Support
The backend includes a `Dockerfile` optimized for production deployment, explicitly handling the installation of necessary system libraries (`poppler-utils` and `openssl`).

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
