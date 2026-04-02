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
- `GET /api/students/class/:className`
- `POST /api/students` (supports `picture` upload, stored as `profileImage`)
- `GET /api/students/:id`
- `PUT /api/students/:id`
- `DELETE /api/students/:id` (soft delete)

### Student Schema
Required:
- `studentName` (String, indexed)
- `class` (String, indexed)
- `fatherName` (String)
- `motherName` (String)
- `admNo` (String, unique per tenant)
- `dateOfBirth` (Date)
- `gender` (`Male` | `Female` | `Other`)

Optional:
- `scholarNumber` (String, unique per tenant when provided)
- `aadharCardNo` (String)
- `apaarId` (String)
- `pen` (String)
- `fatherOccupation` (String)
- `fatherIncome` (Number)
- `motherOccupation` (String)
- `motherIncome` (Number)
- `dateOfAdmission` (Date)
- `caste` (String)
- `category` (String)
- `bloodGroup` (String)
- `bankDetails` (String)
- `address` (String)
- `mobile` (String)
- `profileImage` (String path/url)

System fields:
- `isActive` (Boolean, default `true`)
- `createdAt`, `updatedAt` via `timestamps: true`

### Create Student Request (JSON or multipart/form-data)
```
{
  "studentName": "Bart Simpson",
  "class": "8",
  "scholarNumber": "SCH-1001",
  "aadharCardNo": "123412341234",
  "apaarId": "APAAR12345",
  "pen": "PEN12345",
  "fatherName": "Homer Simpson",
  "fatherOccupation": "Worker",
  "fatherIncome": 45000,
  "motherName": "Marge Simpson",
  "motherOccupation": "Homemaker",
  "motherIncome": 25000,
  "admNo": "ADM-1001",
  "dateOfBirth": "5/7/16",
  "dateOfAdmission": "01/4/2024",
  "gender": "Male",
  "caste": "General",
  "category": "GEN",
  "bloodGroup": "O+",
  "bankDetails": "SBI 1234567890",
  "address": "Springfield",
  "mobile": "9876543210",
  "profileImage": "<file/url>"
}
```

Accepted compatibility aliases:
- `Student Name` -> `studentName`
- `Class` -> `class`
- `className` -> `class`
- `scholarNo`, `Scholar No`, `Scholar Number` -> `scholarNumber`
- `Aadhar Card No` -> `aadharCardNo`
- `APAAR ID` -> `apaarId`
- `PEN` -> `pen`
- `Father Name` -> `fatherName`
- `Mother Name` -> `motherName`
- `Father's Occupation` -> `fatherOccupation`
- `Mother's Occupation` -> `motherOccupation`
- `Father's Income` -> `fatherIncome`
- `Mother's Income` -> `motherIncome`
- `admissionNo` or `registrationNo` -> `admNo`
- `Adm No` -> `admNo`
- `dob` -> `dateOfBirth`
- `DOB` -> `dateOfBirth`
- `Date of Admission` -> `dateOfAdmission`
- `Gender` -> `gender`
- `Caste` -> `caste`
- `Category` -> `category`
- `Blood Group` -> `bloodGroup`
- `Bank Details` -> `bankDetails`
- `Address` -> `address`
- `Mobile` -> `mobile`
- `Profile_Image` or `profile_image` -> `profileImage`
- `father.name` -> `fatherName`
- `mother.name` -> `motherName`

Date handling:
- accepts zero-padded and non-padded dates like `01/02/2016` and `1/2/2016`
- accepts 2-digit years like `1/2/16` and stores them as year `2016`
- stores normalized dates as proper `Date` values in MongoDB

### List, Search, Filter, Pagination
`GET /api/students` query params:
- `page` (default `1`)
- `limit` (default `10`, max `100`)
- `class` or `className`
- `q` (search on `studentName`, `class`, `scholarNumber`, `aadharCardNo`, `apaarId`, `pen`, `fatherName`, `motherName`, `admNo`, `mobile`)
- `includeInactive` (`true|false`, default `false`)
- `sortBy` (`createdAt|studentName|class|admNo|dateOfBirth|dateOfAdmission`)
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

## Student Marksheets
`/api/students/marksheets`
- `POST /api/students/marksheets/import` (multipart/form-data, Excel or CSV)
- `GET /api/students/marksheets`

### Import Marksheet Excel
`POST /api/students/marksheets/import`

Headers:
- authenticated tenant token required

Body (`multipart/form-data`):
- `file`: `.xlsx`, `.xls`, or `.csv`
- `examName`: optional override for all rows
- `academicYear`: optional override for all rows
- `term`: optional override for all rows

Supported student matching priority per row:
1. `scholarNumber` / `Scholar No`
2. `admNo` / `Adm No` / `Admission No`
3. `studentName` + `class`

Supported identity columns in Excel:
- `Scholar No`, `Scholar Number`, `scholarNo`, `scholarNumber`
- `Adm No`, `Admission No`, `admissionNo`, `admNo`, `registrationNo`
- `Student Name`, `Name`, `studentName`
- `Class`, `class`, `className`
- `Exam`, `Exam Name`, `examName`
- `Academic Year`, `Session`, `academicYear`
- `Term`, `term`
- `Result`, `Percentage`, `Obtained Marks`, `Max Marks`

Subject column handling:
- Any non-reserved column is treated as a subject marks column.
- `English`, `Maths`, `Science` -> stored as `marksObtained`
- `English Max`, `Maths Max Marks` -> stored as `maxMarks`
- `English Grade` -> stored as `grade`
- `English Remarks` -> stored as `remarks`

Import behavior:
- Validates that each uploaded row maps to exactly one active student in the same tenant.
- Rejects duplicate student rows inside the same uploaded file.
- Uses upsert on `tenantId + studentId + examName + academicYear + term`.
- Returns `created` vs `updated` status for each imported marksheet.
- Stores a student snapshot with:
  - `name`
  - `fatherName`
  - `motherName`
  - `dob`
  - `pen`
  - `apaarId`
  - `class`
  - `scholarNumber`
  - `admNo`

### Multi-sheet Format (sample-marks.xlsx)
If the Excel file contains the following sheets, the backend expects this exact format and will import accordingly:

Sheet: `Students`
- Columns:
  - `studentId`
  - `scholarNo`
  - `rollNo`
  - `name`
  - `dob`
  - `father`
  - `mother`
  - `classSection`
  - `schoolName`
  - `udise`
  - `session`
  - `rank`
  - `attendance`
  - `result`
  - `remarks`

Sheet: `Scholastic`
- Columns:
  - `studentId`
  - `subject`
  - `t1`
  - `t2`
  - `or1`
  - `pw1`
  - `hy`
  - `t3`
  - `t4`
  - `or2`
  - `pw2`
  - `an`

Sheet: `OtherSubjects`
- Columns:
  - `studentId`
  - `name`
  - `sem1`
  - `sem2`

Sheet: `CoScholastic`
- Columns:
  - `studentId`
  - `name`
  - `grade`
  - `semester`

Import behavior for this format:
- Students are matched by `scholarNo`, `admNo`, or `name + classSection`.
- `studentId` is used only to join rows across sheets.
- Scholastic scores are stored per subject in `scholastic[]` with a `scores` object.
- `OtherSubjects` and `CoScholastic` are stored in `otherSubjects[]` and `coScholastic[]`.

Example response:
```json
{
  "success": true,
  "message": "Marksheets imported",
  "data": {
    "summary": {
      "totalRows": 2,
      "importedCount": 1,
      "createdCount": 1,
      "updatedCount": 0,
      "failedCount": 1
    },
    "failures": [
      {
        "rowNumber": 3,
        "reason": "Student not found",
        "scholarNumber": "SCH-9999"
      }
    ],
    "items": [
      {
        "id": "67aa00000000000000000001",
        "status": "created",
        "examName": "Quarterly",
        "academicYear": "2025-2026",
        "term": "Term 1",
        "student": {
          "name": "Bart Simpson",
          "fatherName": "Homer Simpson",
          "motherName": "Marge Simpson",
          "dob": "2016-07-05T00:00:00.000Z",
          "pen": "PEN12345",
          "apaarId": "APAAR12345",
          "class": "8",
          "scholarNumber": "SCH-1001",
          "admNo": "ADM-1001"
        },
        "subjects": [
          {
            "subject": "English",
            "marksObtained": 78,
            "maxMarks": 100,
            "grade": "B+",
            "remarks": "Good"
          }
        ],
        "totals": {
          "obtainedMarks": 420,
          "maxMarks": 500,
          "percentage": 84,
          "result": "Pass"
        }
      }
    ]
  }
}
```

### Fetch Stored Marksheets
`GET /api/students/marksheets` query params:
- `studentId`
- `scholarNumber`
- `admNo`
- `examName`
- `academicYear`
- `term`

Response:
- Returns stored marksheets in descending `updatedAt` order.
- Each item includes student snapshot, subject-wise marks, and totals for direct UI rendering.

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
- `GET /api/classes` (student-derived class-wise structure, no pagination)
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

### Class List/Search/Filter
`GET /api/classes` query params:
- `q` (search by `className`)
- `academicYear`
- `includeInactive` (`true|false`, default `false`)
- `sortBy` (`createdAt|className|academicYear|monthlyTuitionFee`)
- `sortOrder` (`asc|desc`)

`GET /api/classes` now groups active students by their `class` field. Each returned class contains:
- `className`
- `studentCount`
- `students` (full student objects, no pagination limit)
- class metadata from the class collection when a matching `className` exists

Teacher data is populated when class metadata exists:
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
  - Students: `picture` (stored as `profileImage`)

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
