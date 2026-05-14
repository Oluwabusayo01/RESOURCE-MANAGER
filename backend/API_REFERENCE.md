# API_REFERENCE.md — Resource Manager (RM)
# Backend Contract — For the Backend Developer
# Every endpoint the frontend expects is defined here.

---

## BASE URL
```
http://localhost:8000/api
```

## AUTHENTICATION HEADER
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

## STANDARD ERROR FORMAT
All error responses must follow this shape:
```json
{
  "message": "Human-readable error message.",
  "errors": {
    "fieldName": ["Validation message here."]
  }
}
```
`errors` is optional — only include for validation failures (422).

## HTTP STATUS CODES

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate email, booking clash) |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## AUTH ENDPOINTS

### POST /api/auth/register
**Body:**
```json
{
  "name": "Chukwuemeka Obi",
  "email": "emeka@fci.edu",
  "password": "securepassword",
  "department": "Computer Science",
  "role": "classrep"
}
```
`role` must be: `classrep` | `staff`

**201 Response:**
```json
{
  "message": "Registration successful. Await admin approval.",
  "user": {
    "id": "u1",
    "name": "Chukwuemeka Obi",
    "email": "emeka@fci.edu",
    "role": "classrep",
    "department": "Computer Science",
    "status": "pending"
  }
}
```
**409** — Email exists: `{ "message": "An account with this email already exists." }`

---

### POST /api/auth/login
**Body:**
```json
{ "email": "emeka@fci.edu", "password": "securepassword" }
```
**200 Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u1",
    "name": "Chukwuemeka Obi",
    "email": "emeka@fci.edu",
    "role": "classrep",
    "department": "Computer Science",
    "status": "approved"
  }
}
```
**401** — Wrong credentials: `{ "message": "Invalid email or password." }`

---

### GET /api/auth/me 🔒
Returns current logged-in user profile.

**200 Response:** User object (same shape as login response user field)

---

## USER ENDPOINTS

### GET /api/users 🔒 Admin only
Query params (all optional): `role`, `department`, `status`

**200 Response:** Array of user objects
```json
[
  {
    "id": "u1",
    "name": "Chukwuemeka Obi",
    "email": "emeka@fci.edu",
    "role": "classrep",
    "department": "Computer Science",
    "status": "approved"
  }
]
```

---

### PATCH /api/users/:id/approve 🔒 Admin only
**200 Response:** `{ "message": "User approved.", "user": { ...updatedUser } }`

---

### PATCH /api/users/:id/reject 🔒 Admin only
**200 Response:** `{ "message": "User rejected.", "user": { ...updatedUser } }`

---

## RESOURCE ENDPOINTS

### GET /api/resources
Public. Query params (optional): `status` (`active` | `inactive`)

**200 Response:**
```json
[
  {
    "id": "r1",
    "name": "Computer Lab A",
    "type": "lab",
    "capacity": 40,
    "status": "active"
  }
]
```
`type` is one of: `lab` | `seminar` | `hall` | `equipment` | `meeting`
`capacity` can be `null` for equipment.
  
---

### POST /api/resources 🔒 Admin only
**Body:**
```json
{ "name": "Computer Lab D", "type": "lab", "capacity": 35, "status": "active" }
```
**201 Response:** `{ "message": "Resource created.", "resource": { ...newResource } }`

---
  
### PUT /api/resources/:id 🔒 Admin only
**Body:** Same fields as POST (send only fields to update)
**200 Response:** `{ "message": "Resource updated.", "resource": { ...updatedResource } }`

---  

### PATCH /api/resources/:id/status 🔒 Admin only
**Body:** `{ "status": "inactive" }`
**200 Response:** `{ "message": "Status updated.", "resource": { ...updatedResource } }`

---

### GET /api/resources/:id/availability
Public. Query params (all required):
- `date` — e.g. `2026-05-10`
- `startTime` — e.g. `09:00`
- `endTime` — e.g. `11:00`

**200 Response (available):** `{ "available": true }`
**200 Response (taken):** `{ "available": false }`

---

## BOOKING ENDPOINTS

### GET /api/bookings
- Public/unauthenticated: returns confirmed bookings only
- Class Rep / Staff 🔒: returns their own bookings
- Admin 🔒: returns all bookings

**Query params (all optional):**
| Param | Type | Description |
|---|---|---|
| `date` | string | `today` or `YYYY-MM-DD` |
| `status` | string | `confirmed` \| `cancelled` |
| `department` | string | Filter by department |
| `resourceId` | string | Filter by resource |
| `userId` | string | `me` or specific ID (admin only) |
| `from` | string | Start of date range |
| `to` | string | End of date range |
| `limit` | number | Max results |

**200 Response:**
```json
[
  {
    "id": "b1",
    "resourceId": "r1",
    "resource": {
      "id": "r1", "name": "Computer Lab A",
      "type": "lab", "capacity": 40, "status": "active"
    },
    "userId": "u1",
    "user": {
      "id": "u1", "name": "Chukwuemeka Obi",
      "role": "classrep", "department": "Computer Science"
    },
    "course": "CSC 401 - Software Engineering",
    "notes": "Practical session",
    "date": "2026-05-10",
    "startTime": "09:00",
    "endTime": "11:00",
    "status": "confirmed",
    "attendance": null,
    "department": "Computer Science",
    "createdAt": "2026-05-08T10:30:00Z"
  }
]
```

---

### POST /api/bookings 🔒 classrep | staff | admin
**Body:**
```json
{
  "resourceId": "r1",
  "date": "2026-05-10",
  "startTime": "09:00",
  "endTime": "11:00",
  "course": "CSC 401 - Software Engineering",
  "notes": "Optional notes here"
}
```
**201 Response:** `{ "message": "Booking confirmed.", "booking": { ...newBooking } }`
**409 Response:** `{ "message": "This time slot is already taken. Please choose another." }`

Backend must check for overlapping bookings on the same resource before creating.

---

### GET /api/bookings/:id 🔒
**200 Response:** Single booking object (same shape as list item above)
**404 Response:** `{ "message": "Booking not found." }`

---

### PATCH /api/bookings/:id/cancel 🔒 Owner or admin
**200 Response:** `{ "message": "Booking cancelled.", "booking": { ...updatedBooking } }`

---

### PATCH /api/bookings/:id/attendance 🔒 Booking owner
**Body:** `{ "attendance": 35 }`
**200 Response:** `{ "message": "Attendance logged.", "booking": { ...updatedBooking } }`

---

### DELETE /api/bookings/:id 🔒 Admin only
**200 Response:** `{ "message": "Booking deleted." }`

---

## NOTIFICATION ENDPOINTS

### GET /api/notifications 🔒
Query params (optional): `unread` (boolean), `limit` (number)

**200 Response:**
```json
[
  {
    "id": "n1",
    "type": "booking_confirmed",
    "message": "Your booking for Computer Lab A (CSC 401) has been confirmed.",
    "timestamp": "2026-05-08T10:31:00Z",
    "read": false,
    "userId": "u1"
  }
]
```
`type` is one of: `booking_confirmed` | `registration_approved` | `registration_rejected` | `class_update` | `system`

---

### PATCH /api/notifications/:id/read 🔒
**200 Response:** `{ "message": "Marked as read." }`

---

### PATCH /api/notifications/read-all 🔒
**200 Response:** `{ "message": "All notifications marked as read." }`

---

### POST /api/notifications/class-update 🔒 classrep | staff
**Body:**
```json
{
  "title": "Lecture Rescheduled",
  "message": "CSC 401 has been moved to Computer Lab B today.",
  "department": "Computer Science"
}
```
Backend should create a notification for all users in the given department.

**201 Response:** `{ "message": "Class update sent." }`

---

## E-LIBRARY ENDPOINTS

### GET /api/library
Public — no auth required.
Query params (optional): `search` (string), `department` (string), `uploadedBy` (`me` — requires auth)

**200 Response:**
```json
[
  {
    "id": "m1",
    "title": "Introduction to Algorithms",
    "course": "CSC 201",
    "department": "Computer Science",
    "description": "Lecture notes covering sorting and complexity.",
    "uploadedBy": "Dr. Aisha Bello",
    "uploadedById": "u2",
    "fileType": "pdf",
    "fileUrl": "https://storage.example.com/files/algo.pdf",
    "createdAt": "2026-04-10T09:00:00Z"
  }
]
```

---

### POST /api/library 🔒 staff | admin
Request: `multipart/form-data`
```
title: "Introduction to Algorithms"
course: "CSC 201"
department: "Computer Science"
description: "Optional description"
file: <file binary>
```
**201 Response:** `{ "message": "Material uploaded.", "material": { ...newMaterial } }`

---

### GET /api/library/:id/download
Public — no auth required.
**200 Response:** `{ "fileUrl": "https://storage.example.com/files/algo.pdf" }`

Frontend will open fileUrl in a new browser tab.

---

### DELETE /api/library/:id 🔒 Uploader or admin
**200 Response:** `{ "message": "Material deleted." }`

---

## ADMIN ANALYTICS ENDPOINTS

### GET /api/admin/stats 🔒 Admin only
**200 Response:**
```json
{
  "totalBookingsThisMonth": 42,
  "pendingUsers": 3,
  "totalUsers": 28,
  "mostBookedResource": {
    "id": "r1",
    "name": "Computer Lab A",
    "bookingCount": 18
  }
}
```

---

### GET /api/admin/analytics/by-department 🔒 Admin only
**200 Response:**
```json
[
  { "department": "Computer Science", "count": 24 },
  { "department": "Cyber Security", "count": 12 },
  { "department": "Information Systems Sciences (INS)", "count": 6 }
]
```

---

### GET /api/admin/analytics/peak-hours 🔒 Admin only
**200 Response:**
```json
[
  { "hour": "08:00", "count": 2 },
  { "hour": "09:00", "count": 8 },
  { "hour": "10:00", "count": 12 },
  { "hour": "11:00", "count": 10 },
  { "hour": "12:00", "count": 4 },
  { "hour": "13:00", "count": 7 },
  { "hour": "14:00", "count": 11 },
  { "hour": "15:00", "count": 9 },
  { "hour": "16:00", "count": 5 },
  { "hour": "17:00", "count": 3 }
]
```

---

### GET /api/admin/activity 🔒 Admin only
Query params (optional): `limit` (default: 5)

**200 Response:**
```json
[
  {
    "id": "a1",
    "type": "booking_created",
    "description": "Chukwuemeka Obi booked Computer Lab A — CSC 401",
    "timestamp": "2026-05-08T10:31:00Z"
  },
  {
    "id": "a2",
    "type": "user_approved",
    "description": "Admin approved Tunde Fashola (Class Rep)",
    "timestamp": "2026-05-08T09:15:00Z"
  }
]
```
`type` is one of: `booking_created` | `booking_cancelled` | `user_registered` | `user_approved` | `user_rejected`

---

## NOTES FOR THE BACKEND DEVELOPER

1. **JWT secret** — store in your own `.env`, never commit it.
2. **Admin account** — pre-seed the admin user in your database on first run. The frontend uses
   `admin@fci.lautech.edu.ng` as the admin email — ensure this matches.
3. **Booking conflict check** — when `POST /api/bookings` is called, check if any existing
   confirmed booking for the same `resourceId` overlaps with the requested `startTime`/`endTime`
   on the same `date`. If yes, return 409.
4. **File storage** — for `/api/library` uploads, store files and return a publicly accessible `fileUrl`.
   Use local disk storage for development, cloud storage (S3, Cloudinary, etc.) for production.
5. **CORS** — enable CORS for `http://localhost:5173` (Vite default) during development.
6. **Timestamps** — return all timestamps in ISO 8601 format: `2026-05-08T10:30:00Z`
7. **The frontend switches between mock and real API** by changing `VITE_USE_MOCK` in `.env`.
   No frontend code changes are needed — just ensure your endpoints match this document exactly.

---

*End of API_REFERENCE.md — Resource Manager (RM) | FCI, LAUTECH*
