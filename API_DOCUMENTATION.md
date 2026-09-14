# API Documentation

## Base URL

Development:

```text
http://localhost:5000/api
```

All protected endpoints require a JWT Bearer token.

```text
Authorization: Bearer <JWT_TOKEN>
```

---

# 1. Health Check

## GET `/api/health`

Checks whether the API is running.

### Authentication

Not required.

### Response

```json
{
  "success": true,
  "message": "API is running"
}
```

---

# 2. Authentication

## POST `/api/auth/register`

Creates a new user account.

### Request Body

```json
{
  "fullName": "Praveen S",
  "email": "praveen@example.com",
  "password": "password123"
}
```

### Validation

* `fullName`: 2-100 characters
* `email`: valid email address
* `password`: 8-72 characters

### Success Response

**201 Created**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "Praveen S",
      "email": "praveen@example.com",
      "createdAt": "2026-09-14T00:00:00.000Z"
    }
  }
}
```

The password and password hash are never returned.

### Duplicate Email

**409 Conflict**

```json
{
  "success": false,
  "message": "Email address is already registered"
}
```

---

## POST `/api/auth/login`

Authenticates a user and returns a JWT.

### Request Body

```json
{
  "email": "praveen@example.com",
  "password": "password123"
}
```

### Success Response

**200 OK**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "user_id",
      "fullName": "Praveen S",
      "email": "praveen@example.com",
      "createdAt": "2026-09-14T00:00:00.000Z"
    }
  }
}
```

### Invalid Credentials

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

The same error is returned for an unknown email and an incorrect password.

---

## POST `/api/auth/logout`

Logs out the authenticated user.

### Authentication

Required.

### Headers

```text
Authorization: Bearer <JWT_TOKEN>
```

### Success Response

**200 OK**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

The frontend removes the stored authentication token after logout.

---

# 3. Projects

## POST `/api/projects`

Creates a new project for the authenticated user.

### Authentication

Required.

### Request Body

```json
{
  "name": "Project Management System",
  "description": "Internship assignment project",
  "status": "IN_PROGRESS",
  "startDate": "2026-09-14",
  "endDate": "2026-10-14"
}
```

### Status Values

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

### Success Response

**201 Created**

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "project_id",
      "userId": "user_id",
      "name": "Project Management System",
      "description": "Internship assignment project",
      "status": "IN_PROGRESS",
      "startDate": "2026-09-14T00:00:00.000Z",
      "endDate": "2026-10-14T00:00:00.000Z",
      "createdAt": "2026-09-14T00:00:00.000Z",
      "updatedAt": "2026-09-14T00:00:00.000Z"
    }
  }
}
```

---

## GET `/api/projects`

Returns projects belonging to the authenticated user.

### Authentication

Required.

### Query Parameters

| Parameter | Description              |
| --------- | ------------------------ |
| `search`  | Search project names     |
| `status`  | Filter by project status |

### Examples

```text
GET /api/projects
```

```text
GET /api/projects?search=Management
```

```text
GET /api/projects?status=IN_PROGRESS
```

```text
GET /api/projects?search=Management&status=IN_PROGRESS
```

### Success Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project_id",
        "userId": "user_id",
        "name": "Project Management System",
        "description": "Internship assignment project",
        "status": "IN_PROGRESS",
        "startDate": "2026-09-14T00:00:00.000Z",
        "endDate": "2026-10-14T00:00:00.000Z",
        "createdAt": "2026-09-14T00:00:00.000Z",
        "updatedAt": "2026-09-14T00:00:00.000Z"
      }
    ]
  }
}
```

---

## GET `/api/projects/:id`

Returns a specific project and its tasks.

### Authentication

Required.

### URL Parameter

```text
id = project ID
```

### Success Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "project_id",
      "userId": "user_id",
      "name": "Project Management System",
      "description": "Internship assignment project",
      "status": "IN_PROGRESS",
      "startDate": "2026-09-14T00:00:00.000Z",
      "endDate": "2026-10-14T00:00:00.000Z",
      "createdAt": "2026-09-14T00:00:00.000Z",
      "updatedAt": "2026-09-14T00:00:00.000Z",
      "tasks": []
    }
  }
}
```

A project belonging to another user is not accessible.

---

## PUT `/api/projects/:id`

Updates an existing project.

### Authentication

Required.

### Request Body

Fields are optional.

```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "COMPLETED",
  "startDate": "2026-09-14",
  "endDate": "2026-10-20"
}
```

### Success Response

**200 OK**

```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {}
  }
}
```

---

## DELETE `/api/projects/:id`

Deletes a project.

### Authentication

Required.

### Success Response

**200 OK**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

Deleting a project also deletes its related tasks through the database cascade relationship.

---

# 4. Tasks

## POST `/api/tasks`

Creates a task under a project.

### Authentication

Required.

### Request Body

```json
{
  "projectId": "project_id",
  "name": "Implement authentication",
  "description": "Build JWT authentication",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "dueDate": "2026-09-20"
}
```

### Priority Values

```text
LOW
MEDIUM
HIGH
```

### Status Values

```text
PENDING
IN_PROGRESS
COMPLETED
```

### Success Response

**201 Created**

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": "task_id",
      "projectId": "project_id",
      "name": "Implement authentication",
      "description": "Build JWT authentication",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "dueDate": "2026-09-20T00:00:00.000Z",
      "createdAt": "2026-09-14T00:00:00.000Z",
      "updatedAt": "2026-09-14T00:00:00.000Z"
    }
  }
}
```

The backend verifies that the authenticated user owns the project before creating the task.

---

## GET `/api/tasks`

Returns tasks belonging to the authenticated user.

### Authentication

Required.

### Query Parameters

| Parameter   | Description                         |
| ----------- | ----------------------------------- |
| `search`    | Search task names                   |
| `status`    | Filter by task status               |
| `priority`  | Filter by priority                  |
| `projectId` | Filter tasks belonging to a project |

### Examples

```text
GET /api/tasks
```

```text
GET /api/tasks?search=authentication
```

```text
GET /api/tasks?status=PENDING
```

```text
GET /api/tasks?priority=HIGH
```

```text
GET /api/tasks?projectId=project_id
```

### Combined Filters

```text
GET /api/tasks?status=PENDING&priority=HIGH
```

---

## GET `/api/tasks/:id`

Returns one task.

### Authentication

Required.

### Success Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task_id",
      "projectId": "project_id",
      "name": "Implement authentication",
      "description": "Build JWT authentication",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "dueDate": "2026-09-20T00:00:00.000Z",
      "createdAt": "2026-09-14T00:00:00.000Z",
      "updatedAt": "2026-09-14T00:00:00.000Z",
      "project": {
        "id": "project_id",
        "name": "Project Management System"
      }
    }
  }
}
```

---

## PUT `/api/tasks/:id`

Updates a task.

### Authentication

Required.

### Request Body

```json
{
  "name": "Complete authentication",
  "priority": "MEDIUM",
  "status": "COMPLETED",
  "dueDate": "2026-09-22"
}
```

All fields are optional.

### Success Response

**200 OK**

```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {}
  }
}
```

---

## DELETE `/api/tasks/:id`

Deletes a task.

### Authentication

Required.

### Success Response

**200 OK**

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

# 5. Dashboard

## GET `/api/dashboard`

Returns dashboard statistics for the authenticated user.

### Authentication

Required.

### Success Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 2,
      "totalTasks": 5,
      "completedTasks": 2,
      "pendingTasks": 2,
      "projectsInProgress": 1
    }
  }
}
```

Statistics only include data belonging to the authenticated user.

---

# 6. Error Responses

## 400 Bad Request

Used when request validation fails.

Example:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": [
      "Please provide a valid email address"
    ]
  }
}
```

## 401 Unauthorized

Used when authentication is missing or invalid.

```json
{
  "success": false,
  "message": "Authentication required"
}
```

or:

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

## 404 Not Found

Used when the requested resource does not exist or does not belong to the authenticated user.

```json
{
  "success": false,
  "message": "Project not found"
}
```

## 409 Conflict

Used for conflicts such as duplicate email registration.

```json
{
  "success": false,
  "message": "Email address is already registered"
}
```

## 429 Too Many Requests

Returned when authentication rate limits are exceeded.

```json
{
  "success": false,
  "message": "Too many authentication attempts. Please try again later."
}
```

## 500 Internal Server Error

Unexpected server errors return a generic message.

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Sensitive implementation details are not exposed to API clients.

---

# 7. Authentication Header

Protected endpoints require:

```text
Authorization: Bearer <JWT_TOKEN>
```

Example:

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The JWT contains the authenticated user's ID.

The backend verifies the token before allowing access to protected resources.
