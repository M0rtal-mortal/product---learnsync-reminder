# CampusSync — Learning Schedule Reminder System

A full-stack campus scheduling platform for students to manage courses, standardized exam reminders, meetings, and notifications.

## Project Structure

```
.
├── backend/
│   ├── config/
│   │   ├── constants.ts        # JWT, server config
│   │   └── passport.ts         # JWT auth strategy
│   ├── db/
│   │   ├── index.ts            # Drizzle DB connection
│   │   ├── schema.ts           # All table definitions + Zod schemas
│   │   └── migrations/
│   │       ├── 0_init_add_user_model.sql
│   │       └── 1773471822125_campus_sync_tables.sql
│   ├── middleware/
│   │   ├── auth.ts             # JWT middleware (authenticateJWT, authenticateLocal)
│   │   └── errorHandler.ts
│   ├── repositories/
│   │   ├── users.ts
│   │   ├── courses.ts
│   │   ├── exams.ts
│   │   ├── meetings.ts
│   │   └── notifications.ts
│   ├── routes/
│   │   ├── auth.ts             # POST /api/auth/signup|login, GET /api/auth/me
│   │   ├── courses.ts          # CRUD + /import
│   │   ├── exams.ts            # CRUD + milestones
│   │   ├── meetings.ts         # CRUD + RSVP
│   │   └── notifications.ts    # CRUD + settings
│   └── server.ts
├── frontend/
│   └── src/
│       ├── App.tsx             # HashRouter + AuthProvider + protected routes
│       ├── pages/
│       │   └── Index.tsx       # Main dashboard with nav, stats, all views
│       ├── components/
│       │   ├── custom/
│       │   │   ├── Login.tsx
│       │   │   ├── Signup.tsx
│       │   │   ├── ScheduleView.tsx   # Day/Week/Month calendar + conflict detection
│       │   │   ├── ExamView.tsx       # Exam reminders + milestones
│       │   │   ├── MeetingView.tsx    # Meeting CRUD + RSVP + share
│       │   │   └── NotificationView.tsx # Notifications + quiet hours settings
│       │   └── ui/             # shadcn/ui components
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── lib/
│       │   ├── api.ts          # All API service methods
│       │   └── utils.ts
│       ├── types/
│       │   └── index.ts        # All TypeScript types
│       └── index.css           # Campus Clarity theme (deep navy + amber)
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, shadcn/ui, React Router DOM (HashRouter)
- **Backend**: Express.js, TypeScript, Drizzle ORM, Passport.js JWT
- **Database**: PostgreSQL
- **Auth**: JWT tokens stored in localStorage

## Key Features

1. **Authentication** — Signup/Login with JWT, protected routes
2. **Course Schedule** — Import from academic affairs system, manual add/delete, week/day/month views
3. **Conflict Detection** — Auto-detects overlapping events, shows alert banner
4. **Exam Reminders** — CET-4/6, NCRE-1/2, custom exams with milestones and progress tracking
5. **Meeting Management** — Create/edit/cancel meetings, RSVP tracking, share via link/email
6. **Notifications** — In-app notifications, quiet hours, multi-channel settings

## Database Tables

- `Users` — auth + profile
- `Courses` — weekly course schedule
- `Exams` — standardized exam reminders
- `ExamMilestones` — study milestones per exam
- `Meetings` — campus meetings
- `MeetingRsvps` — participant RSVP status
- `Notifications` — in-app notifications
- `NotificationSettings` — per-user notification preferences

## API Routes

- `POST /api/auth/signup|login`, `GET /api/auth/me`
- `GET|POST /api/courses`, `PUT|DELETE /api/courses/:id`, `POST /api/courses/import`
- `GET|POST /api/exams`, `PUT|DELETE /api/exams/:id`
- `POST /api/exams/:id/milestones`, `PUT|DELETE /api/exams/milestones/:id`
- `GET|POST /api/meetings`, `PUT|DELETE /api/meetings/:id`, `POST /api/meetings/:id/rsvp`
- `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
- `GET|PUT /api/notifications/settings`

## Design System

Campus Clarity theme: deep navy (`oklch(0.28 0.07 240)`) primary, warm amber (`oklch(0.78 0.15 75)`) accent, light blue-gray background (`oklch(0.955 0.008 240)`). Georgia serif for headings, system-ui for body.

## Code Generation Guidelines

- All API responses: `{ success: boolean, data: T, message?: string }`
- Repository methods accept `z.infer<typeof insertXSchema>` types, use `as InsertX` in `.values()`
- Frontend API calls in `frontend/src/lib/api.ts` using `getAuthHeaders()` helper
- All types in `frontend/src/types/index.ts`
- HashRouter: use `navigate('/path')` not `window.location.href = '/#/path'`
