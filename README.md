# Project Management System

A full-stack Project Management System. The application allows authenticated users to create and manage projects, organize tasks within projects, track progress, and view dashboard statistics.

## Features

### Authentication

* User registration
* User login
* User logout
* JWT-based authentication
* Secure password hashing using bcrypt
* Protected API routes
* User-specific authorization
* Authentication rate limiting

### Project Management

* Create projects
* View all projects
* View individual project details
* Update projects
* Delete projects
* Project status management
* Project start and end dates
* Search projects by name
* Filter projects by status

### Task Management

* Create tasks within projects
* View tasks
* View individual tasks
* Update tasks
* Delete tasks
* Task priority management
* Task status management
* Task due dates
* Search tasks by name
* Filter tasks by status
* Filter tasks by priority
* Filter tasks by project

### Dashboard

The dashboard provides:

* Total projects
* Total tasks
* Completed tasks
* Pending tasks
* Projects currently in progress

All dashboard statistics are calculated for the authenticated user.

## Technology Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS 4

### Backend

* Node.js
* Express
* JavaScript
* ES Modules

### Database

* PostgreSQL

### ORM

* Prisma 7.10.0
* Prisma PostgreSQL adapter

### Security and Validation

* JWT
* bcrypt
* Zod
* express-rate-limit
* Helmet
* CORS

### Logging

* Morgan

## Project Structure

```text
project-management/
│
├── client/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   └── ...
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── types.ts
│   │
│   ├── .env.local
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── project.service.js
│   │   │   ├── task.service.js
│   │   │   └── dashboard.service.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── task.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── project.validator.js
│   │   │   └── task.validator.js
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── prisma.config.ts
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── README.md
├── API_DOCUMENTATION.md
└── DATABASE_SCHEMA.md
```

## Architecture

The backend follows a layered architecture:

```text
Client
  │
  ▼
Routes
  │
  ▼
Middleware
  │
  ├── Authentication
  ├── Validation
  └── Rate Limiting
  │
  ▼
Controllers
  │
  ▼
Services
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL
```

### Why this structure?

Routes define API endpoints, middleware handles cross-cutting concerns such as authentication and validation, controllers handle HTTP requests and responses, and services contain the application's business logic.

This keeps responsibilities separated and makes the application easier to maintain and test.

## Authentication Flow

```text
User
 │
 ▼
Login
 │
 ▼
POST /api/auth/login
 │
 ▼
Find user in PostgreSQL
 │
 ▼
bcrypt password comparison
 │
 ▼
Generate JWT
 │
 ▼
Frontend stores token
 │
 ▼
Bearer token sent with protected requests
 │
 ▼
JWT middleware verifies token
 │
 ▼
req.user.id
```

Passwords are never returned through the API.

Only the password hash is stored in the database, and the hash is generated using bcrypt.

## Authorization

Projects and tasks are restricted to their owner.

For projects, queries verify:

```text
project.id = requested project ID
AND
project.userId = authenticated user ID
```

For tasks, ownership is checked through the project's relationship with the user:

```text
Task
 ↓
Project
 ↓
User
```

This prevents one authenticated user from accessing another user's projects or tasks.

## Environment Variables

### Backend

Create:

```text
server/.env
```

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/project_management"
PORT=5000
CLIENT_URL="http://localhost:3000"
JWT_SECRET="your-development-secret"
JWT_EXPIRES_IN="1d"
```

Do not commit `.env` to GitHub.

### Frontend

Create:

```text
client/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Do not commit `.env.local` to GitHub.

## Prerequisites

Install:

* Node.js
* PostgreSQL
* npm
* pnpm

Verify Node.js:

```bash
node --version
```

Verify npm:

```bash
npm --version
```

Verify pnpm:

```bash
pnpm --version
```

Make sure PostgreSQL is running before starting the backend.

## Database Setup

Create a PostgreSQL database named:

```text
project_management
```

Configure the connection string in:

```text
server/.env
```

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/project_management"
```

Install backend dependencies:

```bash
cd server
npm install
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate the Prisma client:

```bash
npx prisma generate
```

## Running the Backend

From the `server` directory:

```bash
npm run dev
```

The backend runs by default on:

```text
http://localhost:5000
```

Health check:

```text
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "message": "API is running"
}
```

## Running the Frontend

From the `client` directory:

```bash
pnpm install
pnpm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### Tasks

```text
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

### Dashboard

```text
GET /api/dashboard
```

For complete request and response details, see:

```text
API_DOCUMENTATION.md
```

## Validation

The backend uses Zod for request validation.

Examples of validation include:

* required project/task names
* valid email addresses
* minimum password length
* valid enum values
* valid dates
* project end date cannot be before start date

Invalid requests return a `400 Bad Request` response.

## Security

The application includes:

* bcrypt password hashing
* JWT authentication
* protected API routes
* user ownership authorization
* Zod input validation
* Prisma ORM for parameterized database access
* Helmet security headers
* CORS configuration
* authentication rate limiting
* centralized error handling
* protection against sensitive password data being returned

## Testing

The API was tested using Postman.

Important test cases include:

* successful registration
* duplicate email registration
* invalid registration data
* successful login
* incorrect password
* invalid credentials
* protected routes without JWT
* protected routes with valid JWT
* invalid JWT
* project CRUD
* task CRUD
* project search/filtering
* task search/filtering
* dashboard statistics
* ownership authorization
* logout

## Production Build

Frontend:

```bash
cd client
pnpm run build
```

Backend:

```bash
cd server
npm start
```







##            ❤️MADE WITH LOVE AND PASSION  

