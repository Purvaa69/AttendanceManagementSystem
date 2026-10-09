# MarkYourAttendance — On the Go

A role-based attendance management system designed to simplify attendance tracking for administrators, teachers, and students.

## Features

- Role-based login for Admin, Teacher, and Student
- Student and class management
- Attendance marking and history
- Attendance reports and analytics
- Dashboard charts and attendance summaries
- Student-specific attendance tracking
- Password hashing and JWT-based authentication
- Student registration and teacher approval workflow

## Tech Stack

**Frontend:** React, Vite, CSS, Recharts, Lucide React

**Backend:** Node.js, Express.js

**Database:** MySQL

**Authentication:** JSON Web Tokens (JWT), bcryptjs

## Project Structure

- `frontend/` — React user interface
- `backend/` — Express API and database integration

## Local Setup

1. Clone this repository.
2. Install frontend dependencies with `npm install` inside `frontend/`.
3. Install backend dependencies with `npm install` inside `backend/`.
4. Configure your local database and environment variables.
5. Start the backend and frontend using their respective development commands.

## Security

Environment files and credentials must remain private. Never commit database passwords, JWT secrets, or real user credentials to the repository.

## Project Status

Developed as an academic project and currently under development.
