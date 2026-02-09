# Academic Backend

Simple Node.js + Express API with MongoDB persistence, signup/login, and a super-admin who can view all login activity.

## Setup
1) Copy `.env.example` to `.env` and set `JWT_SECRET`, `MONGO_URI`, super admin creds, and `PORT` if needed.
2) Ensure MongoDB is running and reachable at `MONGO_URI`.
3) Install deps (updates lockfile for new Mongo dependency): `npm install`.
4) Start dev server: `npm run dev` (or `npm start`).

## API
- `baseUrl -- https://academic-backend-fol1.onrender.com/`
- `POST /auth/signup` -- body `{ name, email, password, role }`. Creates user (stored in MongoDB).
- `POST /auth/login` -- body `{ email, password }`. Returns JWT + user info and logs the login event.
- `GET /auth/me` -- requires `Authorization: Bearer <token>`. Returns current user profile.
- `GET /auth/admin/logins` -- requires superadmin JWT. Returns all recorded login events.

### Students (auth required)
- `POST /students` -- body `{ name, fatherName, className, session, rollNo?, admissionNo?, phone?, address? }`
- `GET /students` -- optional query `name, className, session, admissionNo, rollNo`
- `GET /students/:id`
- `PATCH /students/:id` -- body any of the student fields
- `DELETE /students/:id` -- also deletes associated fee records
- `GET /students/:id/fees` -- list monthly fee history for a student

### Fees (auth required)
- `POST /fees` -- body `{ studentId, month(1-12), year, amountDue, amountPaid?, dueDate?, notes? }`
- `GET /fees` -- optional query `studentId, month, year, status`
- `GET /fees/:id`
- `PATCH /fees/:id` -- body any of `{ month, year, amountDue, amountPaid, dueDate, notes }`

Login events include user id/email/name/role, timestamp, IP, and user-agent.
