# Tuition Class Management System

A web application for managing tuition class registrations, payments, and student records for EduPhysics Academy.

![CI Pipeline](https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System/workflows/CI%20Pipeline/badge.svg) 
![Deploy](https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System/workflows/Deploy%20to%20Production/badge.svg)

## Group Information

- **Student 1:** Name - Dasun Manjitha | Index No - ITBIN-2313-0062 | Role: DevOps Engineer

- **Student 2:** Name - Samintha Lakshan | Index No - ITBIN-2313-0055 | Role: Full stack Developer  

## Live Deployment URL

🌐 <https://eduphysics-academy.vercel.app/>

## Project Description

This is a tuition class management system we built for managing Physical Science classes. The system allows students to register online and upload their payment receipts. Admins can then verify payments and manage all student records from a dashboard.

Main things it does:
- Students can register and upload payment receipts
- Admin can approve/reject registrations
- Dashboard shows all students and their payment status
- Finance page tracks revenue and pending payments

## Technologies Used

- HTML5, CSS3, JavaScript
- Python Flask (backend)
- MongoDB Atlas (database)
- Cloudinary (for storing receipt images)
- GitHub Actions
- Vercel (frontend hosting)
- Render (backend hosting)
- **Docker & Docker Compose** (containerisation)
- **Nginx** (frontend web server in Docker)
- **Gunicorn** (Python WSGI server in Docker)

## Features

- Student online registration with receipt upload
- Admin login and dashboard
- Student management (add, edit, delete)
- Payment verification system
- Finance analytics and reporting
- Responsive design

---

## 🐳 Docker Setup (Containerised Deployment)

This section describes how to run the complete application stack using Docker and Docker Compose. **No Python, pip, or Node.js installation is required** — Docker handles everything.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24 or newer) — includes Docker Engine and Docker Compose
- Git

### Repository Structure (Docker-relevant files)

```
Tuition-Class-Management-System/
├── docker-compose.yml          ← Orchestrates all services
├── .dockerignore               ← Excludes files from build context
├── .env.example                ← Template for environment variables
├── docker/
│   └── mongo-init.js           ← Seeds the local MongoDB on first run
├── src/
│   ├── backend/
│   │   ├── Dockerfile          ← Builds the Flask/Gunicorn backend image
│   │   ├── app.py
│   │   └── requirements.txt
│   └── frontend/
│       ├── Dockerfile          ← Builds the Nginx frontend image
│       ├── nginx.conf          ← Nginx server configuration
│       └── *.html / scripts/ / styles/
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                  (eduphysics-network)                    │
│                                                          │
│  ┌───────────────┐    /api/*     ┌──────────────────┐   │
│  │   FRONTEND    │ ─────────────▶│    BACKEND       │   │
│  │  Nginx:80     │  proxy_pass   │  Gunicorn:5000   │   │
│  │  (static HTML │               │  (Flask API)     │   │
│  │   CSS, JS)    │               └────────┬─────────┘   │
│  └───────────────┘                        │              │
│         ▲                                 │ MongoDB      │
│         │ Port 80                         ▼ driver       │
│    ┌────┴────┐                  ┌──────────────────┐     │
│    │  HOST   │                  │     MONGO        │     │
│    │localhost│                  │  MongoDB:27017   │     │
│    └─────────┘                  │  (local dev DB)  │     │
│                                 └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

**How requests flow:**
1. Browser opens `http://localhost` → hits Nginx on port 80
2. Nginx serves static HTML/CSS/JS directly
3. JavaScript calls `/api/*` → Nginx proxies these to `backend:5000`
4. Flask processes the request and queries MongoDB

### Quick Start

#### Step 1 — Clone the repository

```bash
git clone https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System.git
cd Tuition-Class-Management-System
```

#### Step 2 — Configure environment variables

```bash
# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` and review the values. The defaults work out-of-the-box with the local MongoDB container. See [Environment Variables](#environment-variables) for options.

#### Step 3 — Build and start all services

```bash
docker compose up -d --build
```

- `--build` forces Docker to rebuild images (required on first run and after code changes)
- `-d` runs containers in the background (detached mode)

#### Step 4 — Access the application

| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost | Main application (served by Nginx) |
| **Backend API** | http://localhost:5000 | Direct Flask API access |
| **API Health** | http://localhost:5000/api/health | Health check endpoint |

**Default admin login:**
- Username: `admin`
- Password: `admin123`

---

### Common Commands

```bash
# Start all services (rebuild images)
docker compose up -d --build

# Start all services (use cached images)
docker compose up -d

# View logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongo

# Stop all services (keeps data)
docker compose down

# Stop all services AND delete all data volumes
docker compose down -v

# Rebuild a single service
docker compose up -d --build backend

# Check health status of containers
docker compose ps

# Open a shell inside a running container
docker compose exec backend sh
docker compose exec frontend sh
```

---

### Environment Variables

The following variables can be set in your `.env` file:

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://eduphysics_user:eduphysics_password@mongo:27017/eduphysics` | MongoDB connection string. Use local container (default) or Atlas URI |
| `MONGO_ROOT_USERNAME` | `admin` | Root username for local MongoDB container |
| `MONGO_ROOT_PASSWORD` | `adminpassword` | Root password for local MongoDB container |
| `FLASK_ENV` | `production` | Flask environment (`development` or `production`) |
| `FRONTEND_URL` | `http://localhost` | Frontend URL added to CORS allow-list |
| `CLOUDINARY_CLOUD_NAME` | *(empty)* | Cloudinary cloud name (optional) |
| `CLOUDINARY_API_KEY` | *(empty)* | Cloudinary API key (optional) |
| `CLOUDINARY_API_SECRET` | *(empty)* | Cloudinary API secret (optional) |

#### Using MongoDB Atlas (Cloud) instead of local MongoDB

To connect to your Atlas cluster instead of the local container, update `.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/eduphysics?retryWrites=true&w=majority
```

The `mongo` container will still start, but the backend will use Atlas.

---

### Troubleshooting

**Port 80 is already in use**
```bash
# Find what is using port 80 and stop it, or change the port in docker-compose.yml:
# ports: - "8080:80"   ← change host port to 8080, then open http://localhost:8080
```

**Backend fails to connect to MongoDB**
```bash
# Check backend logs
docker compose logs backend

# Verify MongoDB is healthy
docker compose ps
```

**Images are out of date after code changes**
```bash
# Always use --build to rebuild images after changing source files
docker compose up -d --build
```

**Reset everything (fresh start)**
```bash
docker compose down -v          # Removes containers AND volumes (all data lost)
docker compose up -d --build    # Rebuild images and start fresh
```

---

## Branch Strategy

We used the following branching strategy:
- `main` - Production branch (deployed)
- `develop` - Integration branch for testing
- `feature/*` - Feature development branches

When working on new features, we created branches like `feature/student-registration` or `feature/finance-page`, then merged them into develop first before merging to main.

## Individual Contributions

### Dasun Manjitha - DevOps Engineer
- Set up the GitHub repository
- Created CI/CD pipelines using GitHub Actions
- Configured deployment on Vercel and Render
- Managed environment variables and secrets
- Wrote deployment documentation
- **Implemented full Docker containerisation (Assignment 2)**

Commits:
- Initial repository setup
- Added GitHub Actions workflow for CI
- Configured Vercel deployment
- Added environment configuration
- Added Missing files .gitignore
- Updated README.md with Live Deployment URL
- Added Docker containerisation (Dockerfile, docker-compose.yml, .dockerignore)

### Samintha Lakshan - Full Stack Developer
- Built all the HTML pages (index, manage, register, finance)
- Created CSS styling and responsive layouts
- Implemented JavaScript functionality
- Connected frontend to backend API

- Developed Flask API endpoints
- Set up MongoDB database connection
- Implemented authentication
- Created student CRUD operations
- Integrated Cloudinary for image uploads


Commits:
- Created homepage with login form
- Built student registration page
- Added admin management dashboard
- Implemented finance analytics page
- Made design responsive for mobile

- Set up Flask app structure
- Added student API endpoints
- Implemented login authentication
- Connected to MongoDB Atlas
- Added Cloudinary integration


## Setup Instructions (Without Docker)

### Prerequisites
- Node.js (version 18 or higher)
- Python 3.8+
- Git

### Installation

```bash
# Clone the repository
git clone [your-repo-url]

# Navigate to project directory
cd tuition-class-management-system
```

### Running Frontend

```bash
cd src/frontend
npx serve .
# Opens at http://localhost:3000
```

### Running Backend

```bash
cd src/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
set MONGODB_URI=your_connection_string
set CLOUDINARY_CLOUD_NAME=your_cloud_name
set CLOUDINARY_API_KEY=your_key
set CLOUDINARY_API_SECRET=your_secret

# Run server
python app.py
# Runs at http://127.0.0.1:5000
```

## Deployment Process

Our CI/CD works like this:

1. When we push code to any branch, GitHub Actions runs the CI pipeline
2. It checks out the code, installs dependencies, and runs linting
3. When code is merged to main, it triggers deployment
4. Frontend automatically deploys to Vercel
5. Backend automatically deploys to Render

The workflows are in `.github/workflows/` folder.

## Challenges Faced

1. **CORS issues** - Had trouble connecting frontend to backend at first. Fixed by properly configuring Flask-CORS with the right origins.

2. **Render cold starts** - The free tier sleeps after 15 mins of no activity. First request takes 30-50 seconds to wake up. We added loading indicators to handle this.

3. **Merge conflicts** - We had some conflicts when multiple people edited similar files. We solved this by communicating better and pulling changes frequently.

4. **Environment variables** - Took some time to figure out how to set them up correctly on both Vercel and Render.

5. **Docker networking** - Connecting the Nginx frontend to the Flask backend inside Docker required setting up an internal bridge network and configuring Nginx as a reverse proxy so the frontend JavaScript could call `/api/*` without CORS issues.

## Live Deployment URL

**Frontend live URL:** https://eduphysics-academy.vercel.app/

**Backend API:** https://eduphysics-api.onrender.com

> **Note:** The backend is hosted on Render's free tier. The first request after inactivity may take 30–50 seconds to wake up the server.

## Default Login

- Username: `admin`
- Password: `admin123`
