# Academic Backend

Simple Node.js + Express API with MongoDB persistence, signup/login, and a super-admin who can view all login activity.

## Setup
1) Copy `.env.example` to `.env` and set `JWT_SECRET`, `MONGO_URI`, super admin creds, and `PORT` if needed.
2) Ensure MongoDB is running and reachable at `MONGO_URI`.
3) Install deps (updates lockfile for new Mongo dependency): `npm install`.
4) Start dev server: `npm run dev` (or `npm start`).

## API
- `POST /auth/signup` -- body `{ name, email, password, role }`. Creates user (stored in MongoDB).
- `POST /auth/login` -- body `{ email, password }`. Returns JWT + user info and logs the login event.
- `GET /auth/me` -- requires `Authorization: Bearer <token>`. Returns current user profile.
- `GET /auth/admin/logins` -- requires superadmin JWT. Returns all recorded login events.

Login events include user id/email/name/role, timestamp, IP, and user-agent.
