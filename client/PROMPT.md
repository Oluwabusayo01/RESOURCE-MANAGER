# PROMPT.md — Resource Manager (RM)
# Master Context File — Read this before generating ANY page or component

---

## 1. PROJECT OVERVIEW

You are building the **Resource Manager (RM)** — a web-based booking and resource management system for the **Faculty of Computing and Informatics (FCI), LAUTECH**.

The three departments in FCI are:
- Computer Science (CS)
- Cyber Security
- Information Systems Sciences (INS)

This is a **frontend project** that will connect to a real REST API backend when it is ready.
Until then, it runs in **mock mode** — all API calls are intercepted and return realistic fake data
so the UI can be fully tested and demoed without a backend.

---

## 2. TECH STACK

| Category | Tool |
|---|---|
| Framework | React + TypeScript |
| Styling | Tailwind CSS |
| Component Library | Shadcn/UI |
| Routing | React Router v6 |
| Global State | Zustand |
| HTTP Client | Axios |
| Calendar | React Big Calendar |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Date/Time | date-fns |
| Notifications | Web Notifications API + setTimeout |

---

## 3. ENVIRONMENT VARIABLES

Create a `.env` file at the project root:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK=true
```

- `VITE_USE_MOCK=true` → app uses mock data (for UI development and demo)
- `VITE_USE_MOCK=false` → app makes real API calls (when backend is ready)

**Never change any component or page code to switch between modes.**
The switch happens only in `.env` — the rest of the app is unaware.

---

## 4. API & MOCK ARCHITECTURE

### Axios Instance
Create `src/lib/axios.ts`:
```ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rm_token')
      localStorage.removeItem('rm_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### Mock API Layer
Create `src/lib/mockApi.ts`:

This file contains mock implementations of every API call.
Each function simulates a network delay (400–800ms) using a Promise timeout,
then returns realistic fake data shaped exactly like the real API would return.

```ts
// Helper to simulate network delay
const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms))
```

All mock functions must:
- Accept the same parameters as the real API call would
- Return data in the exact same shape as the real API response
- Simulate realistic delays (400–800ms) so loading states are visible during demo
- Use the MOCK_DB defined below as the data source
- Mutate MOCK_DB where appropriate (create, update, delete) so changes persist during the session

### MOCK_DB
Define this at the top of `src/lib/mockApi.ts`:

```ts
export const MOCK_DB = {
  users: [
    { id: 'u1', name: 'Chukwuemeka Obi', email: 'emeka@fci.edu', password: 'password123', role: 'classrep', department: 'Computer Science', status: 'approved' },
    { id: 'u2', name: 'Dr. Aisha Bello', email: 'aisha@fci.edu', password: 'password123', role: 'staff', department: 'Cyber Security', status: 'approved' },
    { id: 'u3', name: 'Tunde Fashola', email: 'tunde@fci.edu', password: 'password123', role: 'classrep', department: 'Information Systems Sciences (INS)', status: 'pending' },
    { id: 'u4', name: 'Prof. Kamoru Adeyemi', email: 'kamoru@fci.edu', password: 'password123', role: 'staff', department: 'Computer Science', status: 'pending' },
    { id: 'admin', name: 'Faculty Admin', email: 'admin@fci.lautech.edu.ng', password: 'admin1234', role: 'admin', department: 'Computer Science', status: 'approved' },
  ],

  resources: [
    { id: 'r1', name: 'Computer Lab A', type: 'lab', capacity: 40, status: 'active' },
    { id: 'r2', name: 'Computer Lab B', type: 'lab', capacity: 40, status: 'active' },
    { id: 'r3', name: 'Computer Lab C', type: 'lab', capacity: 30, status: 'active' },
    { id: 'r4', name: 'Seminar Room 1', type: 'seminar', capacity: 60, status: 'active' },
    { id: 'r5', name: 'Seminar Room 2', type: 'seminar', capacity: 60, status: 'active' },
    { id: 'r6', name: 'Departmental Hall', type: 'hall', capacity: 200, status: 'active' },
    { id: 'r7', name: 'Projector Unit 1', type: 'equipment', capacity: null, status: 'active' },
    { id: 'r8', name: 'Projector Unit 2', type: 'equipment', capacity: null, status: 'active' },
    { id: 'r9', name: 'Faculty Meeting Room', type: 'meeting', capacity: 20, status: 'active' },
  ],

  bookings: [
    { id: 'b1', resourceId: 'r1', resource: { id: 'r1', name: 'Computer Lab A', type: 'lab', capacity: 40, status: 'active' }, userId: 'u1', user: { id: 'u1', name: 'Chukwuemeka Obi', role: 'classrep', department: 'Computer Science' }, course: 'CSC 401 - Software Engineering', notes: 'Practical session', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '11:00', status: 'confirmed', attendance: 35, department: 'Computer Science', createdAt: new Date().toISOString() },
    { id: 'b2', resourceId: 'r4', resource: { id: 'r4', name: 'Seminar Room 1', type: 'seminar', capacity: 60, status: 'active' }, userId: 'u2', user: { id: 'u2', name: 'Dr. Aisha Bello', role: 'staff', department: 'Cyber Security' }, course: 'CYB 301 - Network Security', notes: '', date: new Date().toISOString().split('T')[0], startTime: '13:00', endTime: '15:00', status: 'confirmed', attendance: null, department: 'Cyber Security', createdAt: new Date().toISOString() },
    { id: 'b3', resourceId: 'r2', resource: { id: 'r2', name: 'Computer Lab B', type: 'lab', capacity: 40, status: 'active' }, userId: 'u1', user: { id: 'u1', name: 'Chukwuemeka Obi', role: 'classrep', department: 'Computer Science' }, course: 'CSC 305 - Database Systems', notes: '', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], startTime: '10:00', endTime: '12:00', status: 'confirmed', attendance: null, department: 'Computer Science', createdAt: new Date().toISOString() },
  ],

  notifications: [
    { id: 'n1', type: 'booking_confirmed', message: 'Your booking for Computer Lab A (CSC 401) has been confirmed.', timestamp: new Date().toISOString(), read: false, userId: 'u1' },
    { id: 'n2', type: 'registration_approved', message: 'Your account has been approved. Welcome to RM!', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true, userId: 'u1' },
    { id: 'n3', type: 'booking_confirmed', message: 'Your booking for Seminar Room 1 (CYB 301) has been confirmed.', timestamp: new Date().toISOString(), read: false, userId: 'u2' },
  ],

  library: [
    { id: 'm1', title: 'Introduction to Algorithms', course: 'CSC 201', department: 'Computer Science', description: 'Comprehensive lecture notes covering sorting, searching, and complexity.', uploadedBy: 'Dr. Aisha Bello', uploadedById: 'u2', fileType: 'pdf', fileUrl: '#', createdAt: '2026-04-10T09:00:00Z' },
    { id: 'm2', title: 'Network Security Fundamentals', course: 'CYB 301', department: 'Cyber Security', description: 'Core concepts in network security and cryptography.', uploadedBy: 'Dr. Aisha Bello', uploadedById: 'u2', fileType: 'pdf', fileUrl: '#', createdAt: '2026-04-15T09:00:00Z' },
    { id: 'm3', title: 'Database Design Principles', course: 'CSC 305', department: 'Computer Science', description: 'ER diagrams, normalization, and SQL fundamentals.', uploadedBy: 'Dr. Aisha Bello', uploadedById: 'u2', fileType: 'pptx', fileUrl: '#', createdAt: '2026-04-20T09:00:00Z' },
  ],

  activity: [
    { id: 'a1', type: 'booking_created', description: 'Chukwuemeka Obi booked Computer Lab A — CSC 401', timestamp: new Date().toISOString() },
    { id: 'a2', type: 'booking_created', description: 'Dr. Aisha Bello booked Seminar Room 1 — CYB 301', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 'a3', type: 'user_registered', description: 'Tunde Fashola registered as Class Rep (INS)', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'a4', type: 'user_registered', description: 'Prof. Kamoru Adeyemi registered as Staff (CS)', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ],
}
```

### API Service Layer
Create `src/lib/apiService.ts`:

This is the single file all pages and stores import to make API calls.
It reads `VITE_USE_MOCK` and automatically routes to either the mock or the real Axios call.

```ts
import api from './axios'
import * as mock from './mockApi'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const authService = {
  login: (email: string, password: string) =>
    USE_MOCK ? mock.login(email, password) : api.post('/auth/login', { email, password }).then(r => r.data),
  register: (payload: any) =>
    USE_MOCK ? mock.register(payload) : api.post('/auth/register', payload).then(r => r.data),
  me: () =>
    USE_MOCK ? mock.me() : api.get('/auth/me').then(r => r.data),
}

export const resourceService = {
  getAll: (params?: any) =>
    USE_MOCK ? mock.getResources(params) : api.get('/resources', { params }).then(r => r.data),
  create: (payload: any) =>
    USE_MOCK ? mock.createResource(payload) : api.post('/resources', payload).then(r => r.data),
  update: (id: string, payload: any) =>
    USE_MOCK ? mock.updateResource(id, payload) : api.put(`/resources/${id}`, payload).then(r => r.data),
  toggleStatus: (id: string, status: string) =>
    USE_MOCK ? mock.toggleResourceStatus(id, status) : api.patch(`/resources/${id}/status`, { status }).then(r => r.data),
  checkAvailability: (id: string, params: any) =>
    USE_MOCK ? mock.checkAvailability(id, params) : api.get(`/resources/${id}/availability`, { params }).then(r => r.data),
}

export const bookingService = {
  getAll: (params?: any) =>
    USE_MOCK ? mock.getBookings(params) : api.get('/bookings', { params }).then(r => r.data),
  getById: (id: string) =>
    USE_MOCK ? mock.getBookingById(id) : api.get(`/bookings/${id}`).then(r => r.data),
  create: (payload: any) =>
    USE_MOCK ? mock.createBooking(payload) : api.post('/bookings', payload).then(r => r.data),
  cancel: (id: string) =>
    USE_MOCK ? mock.cancelBooking(id) : api.patch(`/bookings/${id}/cancel`).then(r => r.data),
  logAttendance: (id: string, attendance: number) =>
    USE_MOCK ? mock.logAttendance(id, attendance) : api.patch(`/bookings/${id}/attendance`, { attendance }).then(r => r.data),
  delete: (id: string) =>
    USE_MOCK ? mock.deleteBooking(id) : api.delete(`/bookings/${id}`).then(r => r.data),
}

export const notificationService = {
  getAll: (params?: any) =>
    USE_MOCK ? mock.getNotifications(params) : api.get('/notifications', { params }).then(r => r.data),
  markRead: (id: string) =>
    USE_MOCK ? mock.markNotificationRead(id) : api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    USE_MOCK ? mock.markAllNotificationsRead() : api.patch('/notifications/read-all').then(r => r.data),
  pushClassUpdate: (payload: any) =>
    USE_MOCK ? mock.pushClassUpdate(payload) : api.post('/notifications/class-update', payload).then(r => r.data),
}

export const libraryService = {
  getAll: (params?: any) =>
    USE_MOCK ? mock.getLibrary(params) : api.get('/library', { params }).then(r => r.data),
  upload: (formData: FormData) =>
    USE_MOCK ? mock.uploadMaterial(formData) : api.post('/library', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  download: (id: string) =>
    USE_MOCK ? mock.downloadMaterial(id) : api.get(`/library/${id}/download`).then(r => r.data),
  delete: (id: string) =>
    USE_MOCK ? mock.deleteMaterial(id) : api.delete(`/library/${id}`).then(r => r.data),
}

export const userService = {
  getAll: (params?: any) =>
    USE_MOCK ? mock.getUsers(params) : api.get('/users', { params }).then(r => r.data),
  approve: (id: string) =>
    USE_MOCK ? mock.approveUser(id) : api.patch(`/users/${id}/approve`).then(r => r.data),
  reject: (id: string) =>
    USE_MOCK ? mock.rejectUser(id) : api.patch(`/users/${id}/reject`).then(r => r.data),
}

export const adminService = {
  getStats: () =>
    USE_MOCK ? mock.getAdminStats() : api.get('/admin/stats').then(r => r.data),
  getByDepartment: () =>
    USE_MOCK ? mock.getBookingsByDepartment() : api.get('/admin/analytics/by-department').then(r => r.data),
  getPeakHours: () =>
    USE_MOCK ? mock.getPeakHours() : api.get('/admin/analytics/peak-hours').then(r => r.data),
  getActivity: (params?: any) =>
    USE_MOCK ? mock.getActivity(params) : api.get('/admin/activity', { params }).then(r => r.data),
}
```

**RULE: Every page and store must import from `src/lib/apiService.ts` — never import from axios.ts or mockApi.ts directly.**

---

## 5. DESIGN SYSTEM — FOLLOW THIS STRICTLY

### Colors
```
Background:     #FFFFFF
Primary Text:   #0A0A0A
Accent/Dark:    #111111  ← sidebar, navbars, primary CTAs
Gold Highlight: #C9A84C  ← active states, accents, badges, borders
Light Gray:     #F5F5F5  ← card backgrounds, input fills
Mid Gray:       #CCCCCC  ← borders, dividers, muted text
Dark Gray:      #555555  ← secondary text, captions
```

### Typography
- Font: **Inter** or **DM Sans** — import from Google Fonts
- Headings: bold, tight letter spacing
- Body: regular weight, 15–16px, comfortable line height

### Style Rules
- Minimal and premium — think Notion meets Linear
- White backgrounds, black structure, gold as the only color accent
- Cards: white bg, `shadow-sm`, light gray border
- Primary button: black bg + white text
- Secondary button: white bg + black border
- Sidebar: `#111111` bg, white text, active item has gold left border + gold text
- Max border radius: `rounded-lg`
- All interactive elements: `transition-all duration-200`
- Page entry: Framer Motion fade-in + slight slide up

### Status Badge Colors
```
Confirmed:  bg-green-100  text-green-700
Pending:    bg-yellow-100 text-yellow-700
Cancelled:  bg-red-100    text-red-700
Rejected:   bg-red-100    text-red-700
Active:     bg-blue-100   text-blue-700
Inactive:   bg-gray-100   text-gray-500
```

---

## 6. USER ROLES

| Role | Access |
|---|---|
| Public | Public Schedule, E-Library only (no login) |
| Class Rep | Book resources, log attendance, push class updates |
| Staff | Everything Class Rep can do + upload study materials |
| Admin | Manage users, manage resources, all bookings, analytics |

**Mock login credentials for testing:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@fci.lautech.edu.ng | admin1234 |
| Class Rep | emeka@fci.edu | password123 |
| Staff | aisha@fci.edu | password123 |
| Pending User | tunde@fci.edu | password123 |

---

## 7. AUTHENTICATION FLOW

```
POST /api/auth/login (or mock equivalent)
        ↓
Returns { token, user }
        ↓
Store in localStorage: rm_token, rm_user
        ↓
Redirect based on role + status:
  admin    → /admin/dashboard
  classrep + approved → /classrep/dashboard
  staff    + approved → /staff/dashboard
  pending or rejected → /status
```

On app load: read `rm_user` + `rm_token` from localStorage → rehydrate `useAuthStore`.

---

## 8. BOOKING FLOW

```
User submits booking form
        ↓
apiService.bookingService.create(payload)
        ↓
201 / mock success  →  Booking confirmed, show success toast
409 / mock conflict →  "This time slot is already taken. Please choose another."
Other error         →  Generic error toast
```

---

## 9. ERROR HANDLING PATTERN

```ts
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleSubmit = async (payload) => {
  setLoading(true)
  setError(null)
  try {
    const data = await someService.action(payload)
    toast.success('Done!')
  } catch (err: any) {
    const message = err.message || err.response?.data?.message || 'Something went wrong.'
    setError(message)
    toast.error(message)
  } finally {
    setLoading(false)
  }
}
```

- Disable submit buttons while loading
- Show inline errors on form submissions
- Show skeleton loaders while fetching list/page data
- Always include a retry button on failed page-level fetches

---

## 10. TYPESCRIPT TYPES

Define all in `src/types/index.ts`:

```ts
export type UserRole = 'classrep' | 'staff' | 'admin'
export type UserStatus = 'pending' | 'approved' | 'rejected'
export type BookingStatus = 'confirmed' | 'cancelled'
export type ResourceStatus = 'active' | 'inactive'
export type ResourceType = 'lab' | 'seminar' | 'hall' | 'equipment' | 'meeting'
export type NotificationType =
  | 'booking_confirmed' | 'registration_approved' | 'registration_rejected'
  | 'class_update' | 'auto_reminder' | 'system'
export type Department =
  | 'Computer Science' | 'Cyber Security' | 'Information Systems Sciences (INS)'

export interface User {
  id: string; name: string; email: string; role: UserRole
  department: Department; status: UserStatus
}
export interface Resource {
  id: string; name: string; type: ResourceType
  capacity: number | null; status: ResourceStatus
}
export interface Booking {
  id: string; resourceId: string; resource: Resource
  userId: string; user: Partial<User>; course: string; notes?: string
  date: string; startTime: string; endTime: string
  status: BookingStatus; attendance: number | null
  department: Department; createdAt: string
}
export interface Notification {
  id: string; type: NotificationType; message: string
  timestamp: string; read: boolean; userId: string
}
export interface LibraryMaterial {
  id: string; title: string; course: string; department: Department
  description?: string; uploadedBy: string; uploadedById: string
  fileType: 'pdf' | 'docx' | 'pptx'; fileUrl: string; createdAt: string
}
```

---

## 11. FOLDER STRUCTURE

```
src/
├── assets/
├── components/
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── ResourceCard.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── BookingModal.tsx
│   │   ├── ClassUpdateModal.tsx
│   │   └── FileUploader.tsx
│   ├── calendar/
│   │   └── CalendarView.tsx
│   └── charts/
│       ├── BookingsByDepartment.tsx
│       └── PeakHoursChart.tsx
├── pages/
│   ├── public/
│   │   ├── HomePage.tsx
│   │   ├── SchedulePage.tsx
│   │   └── ELibraryPage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── StatusPage.tsx
│   ├── classrep/
│   │   ├── ClassRepDashboard.tsx
│   │   ├── BookingPage.tsx
│   │   ├── BookingDetailPage.tsx
│   │   └── NotificationsPage.tsx
│   ├── staff/
│   │   ├── StaffDashboard.tsx
│   │   ├── UploadMaterialPage.tsx
│   │   └── NotificationsPage.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── ManageResourcesPage.tsx
│       ├── ManageUsersPage.tsx
│       └── AllBookingsPage.tsx
├── store/
│   ├── useAuthStore.ts
│   ├── useBookingStore.ts
│   ├── useResourceStore.ts
│   ├── useNotificationStore.ts
│   └── useLibraryStore.ts
├── lib/
│   ├── axios.ts        ← real Axios instance
│   ├── mockApi.ts      ← all mock functions + MOCK_DB
│   ├── apiService.ts   ← routes to mock or real based on VITE_USE_MOCK
│   └── utils.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

---

## 12. ROUTING STRUCTURE

```
/ → HomePage (public)
/schedule → SchedulePage (public)
/library → ELibraryPage (public)
/login → LoginPage
/register → RegisterPage
/status → StatusPage

/classrep/dashboard → ClassRepDashboard [protected: classrep]
/classrep/book → BookingPage [protected: classrep]
/classrep/bookings/:id → BookingDetailPage [protected: classrep]
/classrep/notifications → NotificationsPage [protected: classrep]

/staff/dashboard → StaffDashboard [protected: staff]
/staff/book → BookingPage [protected: staff]
/staff/bookings/:id → BookingDetailPage [protected: staff]
/staff/upload → UploadMaterialPage [protected: staff]
/staff/notifications → NotificationsPage [protected: staff]

/admin/dashboard → AdminDashboard [protected: admin]
/admin/resources → ManageResourcesPage [protected: admin]
/admin/users → ManageUsersPage [protected: admin]
/admin/bookings → AllBookingsPage [protected: admin]
```

---

## 13. GENERAL RULES FOR THE AI

- Always use **TypeScript** with types from `src/types/index.ts`
- Always use **Tailwind CSS** — no inline styles, no CSS modules
- Always use **Shadcn/UI** components where applicable
- Always call services from `src/lib/apiService.ts` — never call axios or mockApi directly
- Always show **loading skeletons** while data is being fetched
- Always show **error states** with a retry button on failed fetches
- Always show **empty states** when lists return no data
- Always wrap pages in **Framer Motion** fade-in animation
- **Navbar** on public pages, **Sidebar** on all dashboard pages
- All forms use **React Hook Form + Zod**
- Fully **responsive** — mobile first
- Keep components small and reusable

---

*End of PROMPT.md — Always read this fully before starting any generation task.*
