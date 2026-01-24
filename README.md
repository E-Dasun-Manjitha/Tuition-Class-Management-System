# Tuition Class Management System

A web application for managing tuition class registrations, payments, and student records for EduPhysics Academy.

![CI Pipeline](https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System/workflows/CI%20Pipeline/badge.svg) 
![Deploy](https://github.com/E-Dasun-Manjitha/Tuition-Class-Management-System/workflows/Deploy%20to%20Production/badge
.svg)

## Group Information

- **Student 1:** [E.Dasun Manjitha] - [ITBIN-2313-0062] - Role: DevOps Engineer
- **Student 2:** [A.G.S Lakshan] - [ITBIN-2313-0055] - Role: Full stack Developer  


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

## Features

- Student online registration with receipt upload
- Admin login and dashboard
- Student management (add, edit, delete)
- Payment verification system
- Finance analytics and reporting
- Responsive design

## Branch Strategy

We used the following branching strategy:
- `main` - Production branch (deployed)
- `develop` - Integration branch for testing
- `feature/*` - Feature development branches

When working on new features, we created branches like `feature/student-registration` or `feature/finance-page`, then merged them into develop first before merging to main.

## Individual Contributions

### [E.Dasun Manjitha] - DevOps Engineer
- Set up the GitHub repository
- Created CI/CD pipelines using GitHub Actions
- Configured deployment on Vercel and Render
- Managed environment variables and secrets
- Wrote deployment documentation

Commits:
- Initial repository setup
- Added GitHub Actions workflow for CI
- Configured Vercel deployment
- Added environment configuration

### [A.G.S Lakshan] - Full Stack Developer
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


## Setup Instructions

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


## Live Deployment

**Frontend live URL:** eduphysics-academy.vercel.app

**Backend API:** https://eduphysics-api.onrender.com

4. **Environment variables** - Took some time to figure out how to set them up correctly on both Vercel and Render.

## Default Login

- Username: `admin`
- Password: `admin123`
