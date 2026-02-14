# Academic Backend

Production-ready, multi-tenant School Management CRM backend built with Node.js (ES modules), Express, MongoDB (Mongoose), JWT auth, and Cloudinary image uploads.

Each school is a tenant. All tenant data is isolated by `tenantId`, enforced by middleware and service-layer queries.

## Tech Stack
- Node.js (latest LTS)
- Express.js
- MongoDB + Mongoose
- JWT authentication
- Cloudinary image upload
- Multer memory storage
- bcrypt
- dotenv
- helmet
- cors
- morgan
- express-rate-limit
- winston logger
- cookie-parser
- uuid

## Setup
1. Copy `.env.example` to `.env` and set values.
2. Ensure MongoDB is running and reachable at `MONGO_URI`.
3. Install dependencies: `npm install`.
4. Run dev server: `npm run dev`.

## Environment
```
PORT=
MONGO_URI=
JWT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Base URL
- `https://academic-backend-fol1.onrender.com/`

## Architecture Overview
- Multi-tenant SaaS where each school is a tenant.
- `tenantId` is embedded in JWT and attached to `req.tenantId` by `tenant.middleware`.
- All data models extend a base schema that adds `tenantId`, `createdAt`, and `updatedAt`.
- Controllers call services only; services contain all database logic.

## Auth
JWT payload includes:
- `userId`
- `tenantId`
- `role`

### Register Tenant (School)
`POST /api/tenants/register`

Body:
```
{
  "name": "Modal Public School",
  "slug": "modal-public-school",
  "ownerName": "Ashish Yadav",
  "ownerEmail": "ashishmps@gmail.com",
  "ownerPassword": "ashishmps@123"
}
```

### Login
`POST /api/auth/login`

Body:
```
{
  "email": "ashishmps@gmail.com",
  "password": "ashishmps@123",
  "tenantId": "6372eb5b-991a-43c0-8484-b4cc9b0fcdb9"
}
```

You can also pass `tenantSlug` instead of `tenantId`.

## Protected Routes
All protected routes use:
- `auth.middleware`
- `tenant.middleware`

## Users
`/api/users` (schooladmin only)
- `GET /api/users`
- `POST /api/users` (supports `profileImage` upload)

Body (JSON or multipart/form-data):
```
{
  "name": "Teacher One",
  "email": "teacher@school.com",
  "password": "Password123",
  "role": "teacher",
  "profileImage": "<file>"
}
```

## Students
`/api/students`
- `GET /api/students` (pagination + search + filters)
- `GET /api/students/search?q=`
- `GET /api/students/class/:classId`
- `POST /api/students` (supports `picture` upload)
- `GET /api/students/:id`
- `PUT /api/students/:id`
- `DELETE /api/students/:id` (soft delete)

### Student Schema
Required:
- `studentName` (String, indexed)
- `registrationNo` (String, unique, auto-generated in format `SCH-YYYY-0001`)
- `admissionDate` (Date)
- `classId` (ObjectId, ref: `Class`)
- `feeDiscountPercent` (Number, default `0`)
- `mobileNumber` (String)

Optional:
- `picture` (String path/url)
- `dateOfBirth` (Date)
- `gender` (`Male` | `Female` | `Other`)
- `identificationMark`
- `bloodGroup`
- `disease`
- `birthFormId`
- `caste`
- `religion`
- `previousSchool`
- `previousSchoolId`
- `additionalNotes`
- `orphanStudent` (Boolean)
- `oscStatus` (Boolean)
- `totalSiblings` (Number)
- `address` (String)
- `familyId` (ObjectId, ref: `Family`)

Nested objects:
- `father`: `name`, `education`, `nationalId`, `mobile`, `occupation`, `profession`, `income`
- `mother`: `name`, `education`, `nationalId`, `mobile`, `occupation`, `profession`, `income`

System fields:
- `isActive` (Boolean, default `true`)
- `createdAt`, `updatedAt` via `timestamps: true`

### Create Student Request (JSON or multipart/form-data)
```
{
  "studentName": "Bart Simpson",
  "classId": "<class-id>",
  "admissionDate": "2026-01-10",
  "mobileNumber": "+1-555-111",
  "feeDiscountPercent": 10,
  "gender": "Male",
  "address": "Springfield",
  "father": {
    "name": "Homer Simpson",
    "mobile": "+1-555-999",
    "occupation": "Nuclear Plant Worker",
    "income": 4500
  },
  "mother": {
    "name": "Marge Simpson",
    "mobile": "+1-555-888",
    "occupation": "Homemaker",
    "income": 2000
  },
  "picture": "<file>"
}
```

### List, Search, Filter, Pagination
`GET /api/students` query params:
- `page` (default `1`)
- `limit` (default `10`, max `100`)
- `classId`
- `q` (search on `studentName`, `registrationNo`, `mobileNumber`)
- `includeInactive` (`true|false`, default `false`)
- `sortBy` (`createdAt|studentName|registrationNo|admissionDate`)
- `sortOrder` (`asc|desc`)

Response shape:
```
{
  "success": true,
  "message": "Students fetched",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 57,
      "totalPages": 6,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Soft Delete Behavior
- `DELETE /api/students/:id` sets `isActive=false`
- Soft-deleted students are excluded from normal list/get queries unless `includeInactive=true` on list

## Teachers
`/api/teachers`
- `GET /api/teachers` (pagination + search + role/status filters)
- `GET /api/teachers/search?q=`
- `GET /api/teachers/role/:role`
- `POST /api/teachers` (supports `picture` upload)
- `GET /api/teachers/:id`
- `PUT /api/teachers/:id`
- `DELETE /api/teachers/:id` (soft delete)

### Teacher Schema
Required:
- `employeeName` (String, indexed)
- `employeeId` (String, unique, auto-generated in format `EMP-YYYY-0001`)
- `mobileNumber` (String, indexed)
- `joiningDate` (Date)
- `role` (`Teacher` | `Admin` | `Accountant` | `Principal` | `Clerk` | `Other`)
- `monthlySalary` (Number)

Optional:
- `picture` (String path/url)
- `fatherOrHusbandName`
- `nationalId`
- `education`
- `gender` (`Male` | `Female` | `Other`)
- `religion`
- `bloodGroup`
- `experience` (years)
- `email` (lowercase, unique per tenant when provided)
- `dateOfBirth`
- `address`

Professional/System fields:
- `status` (`Active` | `Inactive` | `On Leave`, default `Active`)
- `isActive` (Boolean, default `true`)
- `createdAt`, `updatedAt` via `timestamps: true`

### Create/Update Teacher Request (JSON or multipart/form-data)
```
{
  "employeeName": "Ravina Mishra",
  "mobileNumber": "7888981414",
  "joiningDate": "2024-01-15",
  "role": "Teacher",
  "monthlySalary": 25000,
  "email": "ravinamishra1223@gmail.com",
  "gender": "Female",
  "experience": 2,
  "status": "Active",
  "picture": ""
}
--- response ->
"success": true,
    "message": "Teacher created",
    "data": {
        "_id": "6990a4bcdc3d0a1c0a729bc7",
        "employeeName": "Ravina Mishra",
        "mobileNumber": "7888981414",
        "joiningDate": "2024-01-15T00:00:00.000Z",
        "role": "Teacher",
        "monthlySalary": 25000,
        "gender": "Female",
        "experience": 2,
        "email": "ravinamishra1223@gmail.com",
        "status": "Active",
        "isActive": true,
        "tenantId": "6372eb5b-991a-43c0-8484-b4cc9b0fcdb9",
        "employeeId": "EMP-2026-0001",
        "createdAt": "2026-02-14T16:37:16.261Z",
        "updatedAt": "2026-02-14T16:37:16.261Z"
    }
```

### Teacher List/Search/Filter/Pagination
`GET /api/teachers` query params:
- `page` (default `1`)
- `limit` (default `10`, max `100`)
- `q` (search on `employeeName`, `employeeId`, `mobileNumber`, `email`)
- `role`
- `status`
- `includeInactive` (`true|false`, default `false`)
- `sortBy` (`createdAt|employeeName|employeeId|joiningDate|monthlySalary`)
- `sortOrder` (`asc|desc`)

### Teacher Soft Delete Behavior
- `DELETE /api/teachers/:id` sets `isActive=false` and `status=Inactive`
- Soft-deleted teachers are excluded from normal list/get queries unless `includeInactive=true` on list

## Classes
`/api/classes`
- `GET /api/classes` (pagination + search + filter)
- `POST /api/classes`
- `GET /api/classes/teacher/:teacherId`
- `GET /api/classes/:id`
- `PUT /api/classes/:id`
- `DELETE /api/classes/:id` (soft delete)

### Class Schema
Required:
- `className` (String, unique per tenant, indexed)
- `monthlyTuitionFee` (Number)
- `classTeacher` (ObjectId, ref `Teacher`)

Optional:
- `classCode` (String, unique per tenant when provided)
- `description` (String)
- `academicYear` (String)
- `maxStudents` (Number)

System fields:
- `isActive` (Boolean, default `true`)
- `createdAt`, `updatedAt` via `timestamps: true`

### Create/Update Class Request
```
{
  "className": "8",
  "monthlyTuitionFee": 2500,
  "classTeacher": "6990a4bcdc3d0a1c0a729bc7",
  "classCode": "CLS-008",
  "description": "Board class",
  "academicYear": "2025-2026",
  "maxStudents": 45
}
```

### Class List/Search/Filter/Pagination
`GET /api/classes` query params:
- `page` (default `1`)
- `limit` (default `10`, max `100`)
- `q` (search by `className`)
- `academicYear`
- `includeInactive` (`true|false`, default `false`)
- `sortBy` (`createdAt|className|academicYear|monthlyTuitionFee`)
- `sortOrder` (`asc|desc`)

Teacher data is populated on class fetch APIs:
- `.populate("classTeacher", "employeeName employeeId mobileNumber")`

### Class Soft Delete Behavior
- `DELETE /api/classes/:id` sets `isActive=false`
- Soft-deleted classes are excluded from normal list/get queries unless `includeInactive=true` on list

## Attendance
`/api/attendance`
- `GET /api/attendance`
- `POST /api/attendance`
- `GET /api/attendance/:id`
- `PUT /api/attendance/:id`
- `DELETE /api/attendance/:id`

Body (create/update):
```
{
  "studentId": "<student-id>",
  "classId": "<class-id>",
  "date": "2026-02-10",
  "status": "present",
  "remarks": "On time"
}
```

## File Uploads
- Uses Multer memory storage + Cloudinary.
- Upload field names:
  - Users: `profileImage`
  - Teachers: `picture`
  - Students: `picture`

## Health Check
`GET /health`

## Production Runtime Notes
- `src/config/db.js`
  - Centralized mongoose connection with pool/timeouts.
  - Logs `connected`, `error`, and `disconnected` events.
  - Exposes `connectDb()` and `disconnectDb()`.
- `src/app.js`
  - Security and API hardening: `helmet`, `cors`, rate limit, `cookie-parser`, request logging.
  - `x-powered-by` disabled.
  - Global `404` route handler and centralized error middleware.
- `src/server.js`
  - Startup flow: connect DB first, then start server.
  - Graceful shutdown on `SIGINT`/`SIGTERM`.
  - Process-level handlers for `unhandledRejection` and `uncaughtException`.

## Folder Structure
```
src/
  config/
    db.js
    cloudinary.js
    env.js

  core/
    tenant.middleware.js
    base.model.js

  modules/
    tenant/
      tenant.model.js
      tenant.service.js
      tenant.controller.js
      tenant.routes.js

    auth/
      auth.model.js
      auth.service.js
      auth.controller.js
      auth.routes.js

    user/
      user.model.js
      user.service.js
      user.controller.js
      user.routes.js

    student/
      student.model.js
      student.validation.js
      student.service.js
      student.controller.js
      student.routes.js

    teacher/
      teacher.model.js
      teacher.validator.js
      teacher.service.js
      teacher.controller.js
      teacher.routes.js

    class/
      class.model.js
      class.validator.js
      class.service.js
      class.controller.js
      class.routes.js

    attendance/
      attendance.model.js
      attendance.service.js
      attendance.controller.js
      attendance.routes.js

  middleware/
    auth.middleware.js
    role.middleware.js
    upload.middleware.js
    error.middleware.js

  utils/
    generateEmployeeId.js
    jwt.js
    logger.js
    response.js

  routes/
    index.js

  app.js
  server.js
```
