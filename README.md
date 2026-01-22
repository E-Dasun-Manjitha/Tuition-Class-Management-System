# Tuition Class Management System

A web application for managing tuition class registrations, payments, and student records for EduPhysics Academy.

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
