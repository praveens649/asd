# Database Schema

## Database

The application uses:

```text
PostgreSQL
```

Prisma is used as the ORM.

The database contains three primary entities:

```text
User
Project
Task
```

## Entity Relationship

```text
┌──────────────┐
│     User     │
├──────────────┤
│ id           │
│ fullName     │
│ email        │
│ passwordHash │
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│   Project    │
├──────────────┤
│ id           │
│ userId       │
│ name         │
│ description  │
│ status       │
│ startDate    │
│ endDate      │
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│     Task     │
├──────────────┤
│ id           │
│ projectId    │
│ name         │
│ description  │
│ priority     │
│ status       │
│ dueDate      │
│ createdAt    │
│ updatedAt    │
└──────────────┘
```

## User

Stores authenticated application users.

| Column         | Type     | Constraints           |
| -------------- | -------- | --------------------- |
| `id`           | String   | Primary key           |
| `fullName`     | String   | Required              |
| `email`        | String   | Required, Unique      |
| `passwordHash` | String   | Required              |
| `createdAt`    | DateTime | Default current time  |
| `updatedAt`    | DateTime | Automatically updated |

### Relationships

One user can own multiple projects.

```text
User 1 → N Project
```

## Project

Stores projects belonging to users.

| Column        | Type          | Constraints           |
| ------------- | ------------- | --------------------- |
| `id`          | String        | Primary key           |
| `userId`      | String        | Foreign key → User    |
| `name`        | String        | Required              |
| `description` | String        | Optional              |
| `status`      | ProjectStatus | Default `NOT_STARTED` |
| `startDate`   | DateTime      | Required              |
| `endDate`     | DateTime      | Required              |
| `createdAt`   | DateTime      | Default current time  |
| `updatedAt`   | DateTime      | Automatically updated |

### Relationships

Each project belongs to one user.

Each project can contain multiple tasks.

```text
User 1 → N Project
Project 1 → N Task
```

### Cascade Behavior

Deleting a user deletes their projects.

Deleting a project deletes its tasks.

This is implemented using Prisma's cascade delete relationships.

## Task

Stores tasks belonging to projects.

| Column        | Type         | Constraints           |
| ------------- | ------------ | --------------------- |
| `id`          | String       | Primary key           |
| `projectId`   | String       | Foreign key → Project |
| `name`        | String       | Required              |
| `description` | String       | Optional              |
| `priority`    | TaskPriority | Default `MEDIUM`      |
| `status`      | TaskStatus   | Default `PENDING`     |
| `dueDate`     | DateTime     | Required              |
| `createdAt`   | DateTime     | Default current time  |
| `updatedAt`   | DateTime     | Automatically updated |

Each task belongs to exactly one project.

```text
Project 1 → N Task
```

## Enumerations

### ProjectStatus

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

### TaskPriority

```text
LOW
MEDIUM
HIGH
```

### TaskStatus

```text
PENDING
IN_PROGRESS
COMPLETED
```

## Foreign Keys

### Project → User

```text
projects.userId
        ↓
users.id
```

This establishes project ownership.

### Task → Project

```text
tasks.projectId
        ↓
projects.id
```

This establishes task ownership through the project.

## Indexes

The schema includes indexes to support common queries.

### Project

```text
userId
status
```

These support user-specific project retrieval and status filtering.

### Task

```text
projectId
status
priority
```

These support project-specific task retrieval and task filtering.

## Authorization Model

The database structure supports user-level data isolation.

For a project:

```text
Authenticated User
        ↓
Project.userId
```

For a task:

```text
Authenticated User
        ↓
Project.userId
        ↓
Task.projectId
```

Therefore a user can only access resources connected to their own account.

## Normalization

The database separates users, projects, and tasks into independent related tables.

Instead of duplicating user information across projects and tasks:

```text
User
 ↓
Project
 ↓
Task
```

foreign keys are used to represent relationships.

This reduces unnecessary duplication and maintains referential integrity.

## Prisma Configuration

The project uses Prisma 7 with PostgreSQL.

The Prisma schema is located at:

```text
server/prisma/schema.prisma
```

The Prisma configuration is located at:

```text
server/prisma.config.ts
```

The database connection URL is provided through:

```text
DATABASE_URL
```

## Database Migration

Create/apply migrations with:

```bash
npx prisma migrate dev
```

Generate the Prisma client with:

```bash
npx prisma generate
```

## Database Design Summary

```text
User
 │
 ├── owns Projects
 │
 └── Projects contain Tasks

User
 1
 │
 N
Project
 1
 │
 N
Task
```

This relational structure supports the application's authentication, project management, task management, dashboard statistics, filtering, and authorization requirements.
