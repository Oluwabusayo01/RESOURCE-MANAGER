# PAGES.md — Step-by-Step AI Prompts
# Resource Manager (RM) — FCI, LAUTECH
# Use these prompts ONE AT A TIME. Always reference PROMPT.md first.

---

## HOW TO USE THIS FILE

1. Open your AI coding assistant (Cursor, Claude Code, Copilot, etc.)
2. At the start of every session paste this first:
   > "Read PROMPT.md fully before you do anything. That is your master context for this project."
3. Copy and paste ONE prompt at a time — in order.
4. Review the output before moving to the next step.
5. Never skip steps — each one builds on the previous.

---

## STEP 0 — PROJECT SETUP

```
Read PROMPT.md first.

Set up the React + TypeScript + Vite project:

1. Install all dependencies from the tech stack in PROMPT.md.

2. Create a .env file at the project root:
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_USE_MOCK=true

3. Add .env to .gitignore.

4. Configure Tailwind CSS and extend the theme in tailwind.config.ts:
   colors: {
     accent: '#111111',
     gold: '#C9A84C',
     'light-gray': '#F5F5F5',
     'mid-gray': '#CCCCCC',
     'dark-gray': '#555555',
   }

5. Set up Shadcn/UI.

6. Create the full folder structure from PROMPT.md section 11.

7. Create src/types/index.ts with all types from PROMPT.md section 10.

8. Create src/lib/axios.ts exactly as written in PROMPT.md section 4.

9. Create src/lib/mockApi.ts with:
   - The MOCK_DB object from PROMPT.md section 4 (with all seed data)
   - A delay() helper: const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms))
   - Implement ALL mock functions listed in apiService.ts below.
     Each function must: await delay(), then return data shaped like the real API would.
     Mutations (create/update/delete) must modify MOCK_DB so changes persist in the session.

   Mock functions to implement:
   login(email, password) — find user in MOCK_DB.users, throw error if not found
   register(payload) — add new user with status:'pending' to MOCK_DB.users
   me() — return current user from localStorage rm_user
   getResources(params?) — return MOCK_DB.resources filtered by params
   createResource(payload) — push to MOCK_DB.resources, return new resource
   updateResource(id, payload) — update in MOCK_DB.resources
   toggleResourceStatus(id, status) — update status field
   checkAvailability(id, { date, startTime, endTime }) — check MOCK_DB.bookings for conflicts
   getBookings(params?) — return MOCK_DB.bookings filtered by params
   getBookingById(id) — find booking by id
   createBooking(payload) — check conflicts first, if clear push to MOCK_DB.bookings with status:'confirmed'
   cancelBooking(id) — set status to 'cancelled'
   logAttendance(id, attendance) — update attendance field
   deleteBooking(id) — remove from MOCK_DB.bookings
   getNotifications(params?) — return MOCK_DB.notifications filtered by userId
   markNotificationRead(id) — set read:true
   markAllNotificationsRead() — set all read:true for current user
   pushClassUpdate(payload) — add new notification to MOCK_DB.notifications
   getLibrary(params?) — return MOCK_DB.library filtered by params
   uploadMaterial(formData) — push new material to MOCK_DB.library
   downloadMaterial(id) — return { fileUrl: '#' }
   deleteMaterial(id) — remove from MOCK_DB.library
   getUsers(params?) — return MOCK_DB.users (exclude admin) filtered by params
   approveUser(id) — set status to 'approved'
   rejectUser(id) — set status to 'rejected'
   getAdminStats() — compute from MOCK_DB: totalBookings, pendingUsers, totalUsers, mostBookedResource
   getBookingsByDepartment() — group MOCK_DB.bookings by department and count
   getPeakHours() — return realistic mock peak hours data (08:00–17:00)
   getActivity(params?) — return MOCK_DB.activity

10. Create src/lib/apiService.ts exactly as written in PROMPT.md section 4.

11. Create all 5 Zustand stores as typed shells:
    useAuthStore, useBookingStore, useResourceStore, useNotificationStore, useLibraryStore

12. Set up React Router v6 in App.tsx with all routes from PROMPT.md section 12.

13. Import Inter font from Google Fonts in index.html.

14. Install and configure Shadcn Sonner. Add <Toaster /> to App.tsx.

Do not generate any pages yet — foundation only.
```

---

## STEP 1 — SHARED COMPONENTS

```
Read PROMPT.md first.

Generate all shared components in src/components/shared/.
All service calls must use src/lib/apiService.ts.

1. ProtectedRoute.tsx
   - Reads auth state from useAuthStore
   - Not logged in → redirect to /login
   - Wrong role → redirect to correct dashboard
   - Pending or rejected status → redirect to /status

2. StatusBadge.tsx
   - Props: status: 'confirmed'|'pending'|'cancelled'|'rejected'|'active'|'inactive'
   - Shadcn Badge with colors from the design system in PROMPT.md

3. ConfirmDialog.tsx
   - Shadcn AlertDialog
   - Props: isOpen, onConfirm, onCancel, title, description, confirmLabel?
   - Used for all destructive actions

4. NotificationBell.tsx
   - Lucide Bell icon with a gold unread count badge
   - On mount: call notificationService.getAll({ unread: true })
   - Store result in useNotificationStore
   - Shows unread count; clicking navigates to the user's notifications page

5. ResourceCard.tsx
   - Props: resource (Resource type)
   - Shows: name, type icon (Lucide), capacity, StatusBadge
   - White card, subtle shadow, gold left border accent

6. BookingModal.tsx
   - Shadcn Dialog with a booking form
   - Fields: Resource (Select), Date, Start Time, End Time, Course Name, Notes
   - On resource/date/time change: call resourceService.checkAvailability()
     * Available → green check: "This resource is available."
     * Not available → red X: "This time slot is already taken. Please choose another."
   - On submit: call bookingService.create(payload)
     * Success → close modal, success toast, call onSuccess() callback prop
     * Conflict → show "This time slot is already taken. Please choose another."
   - React Hook Form + Zod

7. ClassUpdateModal.tsx
   - Shadcn Dialog
   - Fields: Title, Message, Department (defaults to user's department)
   - On submit: call notificationService.pushClassUpdate(payload)
     * Success → toast, close modal

8. FileUploader.tsx
   - Drag and drop file upload area
   - Accepts PDF, DOCX, PPTX only — validate file type
   - Shows selected file name and size after selection
   - Dashed border, gold accent on hover/drag-over
   - Exposes selected File via onChange prop

Follow the design system in PROMPT.md strictly.
```

---

## STEP 2 — NAVBAR & SIDEBAR

```
Read PROMPT.md first.

Generate src/components/shared/Navbar.tsx and src/components/shared/Sidebar.tsx.

Navbar.tsx — public pages only
- White background, black text
- Left: "RM" in bold black + "| FCI LAUTECH" in gold
- Right links when NOT logged in: Home, Schedule, E-Library, Login, Register
- Right links when logged in: Home, Schedule, E-Library, Dashboard, Logout
- Active link: gold underline accent
- Mobile: hamburger menu collapsing into a full-width dropdown
- Logout: clear rm_token and rm_user from localStorage, reset useAuthStore, redirect to /

Sidebar.tsx — all dashboard pages
- Background: #111111, text: white
- Active nav item: gold left border + gold text
- Top: "RM" bold white + "FCI LAUTECH" gold below it
- Links by role (read from useAuthStore):
  * Class Rep: Dashboard, Book a Resource, My Bookings, Notifications
  * Staff: Dashboard, Book a Resource, My Bookings, Upload Material, Notifications
  * Admin: Dashboard, Manage Users, Manage Resources, All Bookings
- Bottom: user name + role badge + Logout button
- Collapsible on mobile with hamburger toggle
- Framer Motion slide-in animation on mount
```

---

## STEP 3 — PAGE 1: LANDING / HOME PAGE

```
Read PROMPT.md first.

Generate src/pages/public/HomePage.tsx. Use Navbar.

Sections:

1. Hero Section
   - Full width, white background
   - Large bold heading: "Book Smarter. Learn Better."
   - Subtext: "The official resource booking system for the Faculty of
     Computing and Informatics, LAUTECH."
   - Two CTAs: "View Schedule" (primary black) | "Login" (secondary outlined)
   - Subtle background grid or geometric pattern for depth

2. Feature Cards (3 side by side)
   - "Real-Time Availability" — CalendarCheck icon in gold
   - "Instant Confirmation" — CheckCircle icon in gold
   - "Role-Based Access" — Shield icon in gold
   - White bg, subtle shadow, clean typography

3. Departments Section
   - Heading: "Serving All FCI Departments"
   - 3 cards: Computer Science | Cyber Security | Information Systems Sciences (INS)
   - Clean minimal cards with name and relevant icon

4. Today's Bookings Snapshot
   - Heading: "Today's Bookings"
   - On mount: call bookingService.getAll({ date: 'today', status: 'confirmed', limit: 4 })
   - Show skeleton loaders while fetching (simulate the 600ms mock delay)
   - Each item: resource name, course, time range, StatusBadge
   - Empty state: "No bookings scheduled for today."
   - "View Full Schedule →" link

5. E-Library Teaser
   - Dark (#111111) background section
   - Heading (white): "Access Study Materials"
   - Subtext (gold): "Lecturers upload notes, slides, and past questions — all free to download."
   - CTA: "Browse E-Library" (gold bg, black text)

6. Footer
   - Black background, white text
   - Left: RM logo + tagline
   - Center: Home, Schedule, E-Library, Login
   - Right: "Faculty of Computing and Informatics, LAUTECH"
   - Bottom bar: copyright

Framer Motion fade-in on entire page.
```

---

## STEP 4 — PAGE 2: PUBLIC SCHEDULE PAGE

```
Read PROMPT.md first.

Generate src/pages/public/SchedulePage.tsx. Use Navbar.

1. Page Header
   - Title: "Resource Schedule"
   - Subtitle: "View all confirmed bookings across FCI resources."

2. Filter Bar
   - Resource (Select) — populated from resourceService.getAll()
   - Department (Select): All | Computer Science | Cyber Security | INS
   - Date (date picker)
   - Reset Filters button

3. Calendar View (React Big Calendar)
   - On mount: call bookingService.getAll({ status: 'confirmed' })
   - Show skeleton while fetching
   - Default view: Week. Toggle: Week | Day
   - Events colour-coded by department:
     * Computer Science: #3B82F6 (blue)
     * Cyber Security: #8B5CF6 (purple)
     * INS: #14B8A6 (teal)
   - Clicking an event opens a read-only Shadcn Dialog:
     Resource name, Course, Date, Start/End time, Booked by (role only), StatusBadge
   - Apply active filters client-side on fetched data

Framer Motion page fade-in.
```

---

## STEP 5 — PAGE 3 & 4: REGISTER & LOGIN PAGES

```
Read PROMPT.md first.

Generate src/pages/auth/RegisterPage.tsx and src/pages/auth/LoginPage.tsx.

RegisterPage.tsx
- Centered card, white bg, shadow — no Navbar/Sidebar
- Logo: "RM | FCI LAUTECH" at top
- Fields:
  * Full Name, Email
  * Password + Confirm Password (both with show/hide toggle)
  * Department (Select): Computer Science | Cyber Security | INS
  * Role — two clickable cards (NOT a dropdown):
    "Class Representative" | "Staff"
    Selected card: black border + gold CheckCircle icon
    Unselected: light gray border
- On submit: call authService.register(payload)
  * Success → redirect to /status
  * Email conflict → inline error: "An account with this email already exists."
  * Other error → toast error
- Link: "Already have an account? Login"
- React Hook Form + Zod

LoginPage.tsx
- Same centered card layout
- Fields: Email, Password (show/hide)
- Hint text below the form (visible only when VITE_USE_MOCK=true):
  "Demo credentials — Admin: admin@fci.lautech.edu.ng / admin1234 |
   Class Rep: emeka@fci.edu / password123 | Staff: aisha@fci.edu / password123"
  Style this as a subtle info box so it is obvious during demo/testing.
- On submit: call authService.login(email, password)
  * Success → store token + user in localStorage + useAuthStore, redirect by role/status
  * Auth error → inline error: "Invalid email or password."
- Link: "Don't have an account? Register"

Both pages: Framer Motion fade-in.
```

---

## STEP 6 — PAGE 5: STATUS PAGE

```
Read PROMPT.md first.

Generate src/pages/auth/StatusPage.tsx. No Navbar or Sidebar.

Read user status from useAuthStore.

If status === 'pending':
- Gold hourglass/clock Lucide icon with subtle pulse animation
- Heading: "Account Pending Approval"
- Body: "Your registration has been submitted. The admin will review your
  account. You will be notified once it is approved."

If status === 'rejected':
- Red XCircle icon
- Heading: "Registration Not Approved"
- Body: "Your account was not approved. Please contact the Faculty admin
  for more information."

Logout button at the bottom (outlined black):
- Clear rm_token and rm_user from localStorage
- Reset useAuthStore
- Redirect to /login

Framer Motion fade-in.
```

---

## STEP 7 — PAGE 6 & 7: CLASS REP & STAFF DASHBOARDS

```
Read PROMPT.md first.

Generate src/pages/classrep/ClassRepDashboard.tsx and src/pages/staff/StaffDashboard.tsx.
Both use the Sidebar layout. Staff dashboard extends Class Rep dashboard.

ClassRepDashboard.tsx

On mount, fetch in parallel using Promise.all:
- bookingService.getAll({ userId: 'me' })
- notificationService.getAll({ limit: 3 })

Sections:

1. Header
   - "Welcome back, [user name] 👋"
   - NotificationBell top right

2. Stats Cards Row (4 cards — compute from fetched bookings)
   - Total My Bookings
   - Upcoming Sessions (confirmed + date >= today)
   - Class Updates Sent (count type:'class_update' in notifications)
   - Total Attendance Logged (sum of attendance values across bookings)
   - Show Shadcn Skeleton while loading

3. Quick Actions
   - "Book a Resource" button → opens BookingModal
     * BookingModal onSuccess: refetch bookings, show toast
   - "Push Class Update" button → opens ClassUpdateModal

4. My Bookings Table
   - Last 5 bookings, newest first
   - Columns: Resource, Course, Date, Time, StatusBadge, Actions
   - View Details → navigate to /classrep/bookings/:id
   - Cancel (only if date is future) → ConfirmDialog → bookingService.cancel(id) → refetch
   - Skeleton loader, empty state: "You have no bookings yet."
   - "View All →" link (can point to same page with no limit for now)

5. Recent Notifications (last 3)
   - Icon + message + relative timestamp (date-fns formatDistanceToNow)
   - "View All →" → /classrep/notifications

StaffDashboard.tsx
- Everything above PLUS:
  * "Upload Study Material" quick action card → /staff/upload
  * Additional stat card: "Materials Uploaded"
    → fetch with libraryService.getAll({ uploadedBy: 'me' }) and count results

Framer Motion staggered animation on stat cards.
```

---

## STEP 8 — PAGE 8 & 9: BOOKING PAGE & BOOKING DETAIL PAGE

```
Read PROMPT.md first.

Generate src/pages/classrep/BookingPage.tsx and src/pages/classrep/BookingDetailPage.tsx.
These are reused by staff via routing — no need to duplicate.

BookingPage.tsx — Sidebar layout
- Heading: "Book a Resource"
- On mount: call resourceService.getAll({ status: 'active' }) to populate the Resource dropdown
- Form card (white, shadow):
  * Resource — Select, each option: "[Name] (X seats)" or "[Name]" if no capacity
  * Date — date picker, disable past dates
  * Start Time — time picker
  * End Time — time picker, must be after start time (Zod refinement)
  * Course Name — free text
  * Notes — optional textarea
- Availability Panel (updates on resource/date/time change):
  * Call resourceService.checkAvailability(resourceId, { date, startTime, endTime })
  * Loading: show spinner + "Checking availability..."
  * Available: green CheckCircle + "This resource is available."
  * Not available: red XCircle + "This time slot is already taken. Please choose another."
  * Submit button disabled while checking or if not available
- On submit: call bookingService.create(payload)
  * Success → success toast + navigate to dashboard
  * 409/conflict → "This time slot is already taken. Please choose another."
- React Hook Form + Zod

BookingDetailPage.tsx — Sidebar layout
- Read :id from URL params
- On mount: call bookingService.getById(id)
- Show skeleton while loading, error state if not found

Sections:
1. Booking Info card
   - Resource name, Course, Date, Start/End time, StatusBadge, Notes

2. Status Timeline (visual step indicator)
   - Step 1: "Submitted" (always complete)
   - Step 2: "Confirmed" (complete if status=confirmed) or "Cancelled" (if cancelled)
   - Style: connected dots/circles, completed steps in gold

3. Log Attendance
   - Visible only if: status=confirmed AND date <= today
   - Number input: "Total Attendees"
   - "Save Attendance" button → bookingService.logAttendance(id, number) → refetch + toast
   - If attendance already logged: show the number with an "Edit" button to toggle input

4. Cancel Booking
   - Visible only if: date is in the future AND status=confirmed
   - ConfirmDialog → bookingService.cancel(id) → navigate back to dashboard + toast
```

---

## STEP 9 — PAGE 10: ADMIN DASHBOARD

```
Read PROMPT.md first.

Generate src/pages/admin/AdminDashboard.tsx. Sidebar layout (admin links).

On mount, fetch in parallel using Promise.all:
- adminService.getStats()
- adminService.getByDepartment()
- adminService.getPeakHours()
- userService.getAll({ status: 'pending' })
- adminService.getActivity({ limit: 5 })

Sections:

1. Header
   - "Admin Dashboard"
   - Subtitle: "Faculty of Computing and Informatics, LAUTECH"
   - NotificationBell top right

2. Stats Cards Row (4 cards)
   - Total Bookings This Month
   - Pending User Registrations
   - Total Registered Users
   - Most Booked Resource (name)
   - Each: white bg, shadow, large number, label, small gold Lucide icon
   - Skeleton loaders while fetching

3. Charts Row
   - Left: "Bookings by Department" — Recharts BarChart
     * Data from adminService.getByDepartment()
     * Bar fill: #C9A84C
   - Right: "Peak Booking Hours" — Recharts LineChart
     * Data from adminService.getPeakHours()
     * Line stroke: #111111

4. Pending Registrations Table
   - Heading: "Pending User Approvals"
   - Columns: Name, Email, Role, Department, Actions
   - Approve → userService.approve(id) → refetch pending list + toast
   - Reject → ConfirmDialog → userService.reject(id) → refetch + toast
   - Skeleton loader, empty state: "No pending registrations. All clear!"

5. Recent Activity Feed
   - Data from adminService.getActivity({ limit: 5 })
   - Each item: icon + description + relative timestamp (date-fns)

Framer Motion staggered animation on stat cards.
```

---

## STEP 10 — PAGE 11 & 12: ADMIN MANAGE RESOURCES & USERS

```
Read PROMPT.md first.

Generate src/pages/admin/ManageResourcesPage.tsx and src/pages/admin/ManageUsersPage.tsx.

ManageResourcesPage.tsx — Sidebar layout
- Heading: "Manage Resources"
- On mount: call resourceService.getAll()
- "Add New Resource" button (top right) → Shadcn Dialog form:
  * Name (text), Type (Select: lab|seminar|hall|equipment|meeting),
    Capacity (number, optional), Status (Select: active|inactive)
  * On submit: resourceService.create(payload) → refetch list + toast
- Resources Table:
  * Columns: Name, Type, Capacity, StatusBadge, Actions
  * Edit → pre-filled Dialog → resourceService.update(id, payload) → refetch + toast
  * Deactivate/Activate → ConfirmDialog → resourceService.toggleStatus(id, newStatus) → refetch
- Skeleton loader, empty state

ManageUsersPage.tsx — Sidebar layout
- Heading: "Manage Users"
- On mount: call userService.getAll()
- Filter bar: Role (Select), Department (Select), Status (Select) — filter client-side
- Users Table:
  * Columns: Name, Email, Role, Department, StatusBadge, Actions
  * Pending → "Approve" | "Reject" buttons
  * Approved → "Revoke Access" button
  * Rejected → "Re-approve" button
  * All actions: ConfirmDialog first → call appropriate userService method → refetch + toast
- Skeleton loader, empty state: "No users found."
```

---

## STEP 11 — PAGE 13: ADMIN ALL BOOKINGS

```
Read PROMPT.md first.

Generate src/pages/admin/AllBookingsPage.tsx. Sidebar layout.

- Heading: "All Bookings"
- On mount: call bookingService.getAll() (admin gets all bookings from mock)

1. Filter Bar
   - Resource (Select — from resourceService.getAll())
   - Department (Select)
   - From Date + To Date pickers
   - On filter change: re-call bookingService.getAll({ resourceId, department, from, to })
   - Reset Filters button

2. Bookings Table (paginated — 10 per page)
   - Columns: Resource, Booked By, Course, Department, Date, Time, StatusBadge, Actions
   - View → Shadcn Dialog with full booking info
   - Cancel → ConfirmDialog → bookingService.cancel(id) → refetch + toast
   - Delete → ConfirmDialog → bookingService.delete(id) → refetch + toast
   - Prev / Next pagination controls

3. Export Button (top right, outlined)
   - UI only → toast: "Export feature coming soon."

Skeleton loader, empty state: "No bookings found."
```

---

## STEP 12 — PAGE 14: E-LIBRARY PAGE

```
Read PROMPT.md first.

Generate src/pages/public/ELibraryPage.tsx. Use Navbar. Fully public.

1. Page Header
   - Title: "E-Library"
   - Subtitle: "Study materials uploaded by FCI lecturers. Free to browse and download."

2. Search & Filter Bar
   - Search input (debounced 300ms) — searches title and course
   - Department filter (Select): All | Computer Science | Cyber Security | INS
   - On change: call libraryService.getAll({ search, department })
   - On mount: call libraryService.getAll() with no filters

3. Materials Grid (3 columns desktop, 1 mobile)
   - Skeleton loaders (6 skeleton cards) while fetching
   - Each card:
     * File type icon in gold (FileText for PDF, FileType for DOCX, Presentation for PPTX)
     * Title (bold), Course name, Department badge
     * "Uploaded by [name]" + formatted date (date-fns format)
     * "Download" button (black, full width)
       → call libraryService.download(id)
       → open fileUrl in new tab (in mock: show toast "Downloading [title]...")
   - Hover: subtle lift (scale-[1.02] + shadow-md)
   - Empty state: "No materials found. Try a different search."

Framer Motion staggered fade-in on cards.
```

---

## STEP 13 — PAGE 15: STAFF UPLOAD MATERIAL

```
Read PROMPT.md first.

Generate src/pages/staff/UploadMaterialPage.tsx. Sidebar layout (staff).

- Heading: "Upload Study Material"
- On mount: call libraryService.getAll({ uploadedBy: 'me' }) → populate My Uploads table

1. Upload Form Card
   - Title (text), Course Name (free text)
   - Department (Select): Computer Science | Cyber Security | INS
   - Description (optional textarea)
   - FileUploader component (PDF, DOCX, PPTX only)
   - "Upload Material" button (black, full width)
   - On submit: build FormData, call libraryService.upload(formData)
     * Success → toast, reset form, refetch My Uploads table
     * Error → inline error message
   - React Hook Form + Zod (title, course, department required; file required)

2. My Uploads Table
   - Columns: Title, Course, Department, Upload Date, Actions
   - Delete → ConfirmDialog → libraryService.delete(id) → refetch + toast
   - Skeleton loader, empty state: "You haven't uploaded any materials yet."

Framer Motion page fade-in.
```

---

## STEP 14 — PAGE 16: NOTIFICATIONS PAGE

```
Read PROMPT.md first.

Generate src/pages/classrep/NotificationsPage.tsx.
Reuse for staff at src/pages/staff/NotificationsPage.tsx — same component, different route.

Sidebar layout.
- Heading: "Notifications"
- On mount: call notificationService.getAll() → store in useNotificationStore

- "Mark All as Read" button (top right, outlined)
  → call notificationService.markAllRead() → update store → re-render list

Notification List (newest first):
- Each item:
  * Unread: bold, gold left border (border-l-4 border-gold), bg-[#FAFAFA]
  * Read: normal weight, no border, white bg
  * Icon by type:
    - booking_confirmed → CalendarCheck (text-green-600)
    - registration_approved → UserCheck (text-green-600)
    - registration_rejected → UserX (text-red-500)
    - class_update → Megaphone (text-gold)
    - auto_reminder → Clock (text-blue-500)
    - system → Info (text-gray-400)
  * Message text + relative timestamp via date-fns formatDistanceToNow
  * On click: call notificationService.markRead(id) → update store → re-render

Empty state: "You have no notifications yet."

Framer Motion staggered list fade-in on notification items.
```

---

## STEP 15 — FINAL: WIRE EVERYTHING TOGETHER

```
Read PROMPT.md first.

Final integration, polish, and verification step.

1. App.tsx
   - All routes from PROMPT.md section 12 wired correctly
   - Dashboard routes wrapped in ProtectedRoute with the correct role
   - 404 catch-all: centered page — "404 — Page Not Found" with a "Go Home" button
   - <Toaster /> from Shadcn Sonner at the root level

2. Auth persistence (in useAuthStore or a useEffect in App.tsx)
   - On mount: read rm_token and rm_user from localStorage
   - If both exist: rehydrate useAuthStore
   - If missing: ensure store is empty, user stays on public routes

3. Auto-reminder system (in useBookingStore or a dedicated hook)
   - After a successful booking (bookingService.create returns success):
     * Calculate ms until 1 hour before booking startTime
     * If that time is in the future: set a setTimeout
     * When it fires:
       - Add auto_reminder notification to useNotificationStore
       - Request Web Notifications API permission if not already granted
       - Show browser notification: "Reminder: [Resource] ([Course]) starts in 1 hour."

4. Demo mode indicator
   - If VITE_USE_MOCK=true, show a small fixed banner at the very bottom of the screen:
     "🟡 Demo Mode — Using mock data. Backend not connected."
   - Style: subtle dark bar, small text, does not obstruct UI
   - This helps during presentations to make it clear this is a demo

5. Final review checklist — verify ALL of these before submission:
   - [ ] All 16 pages load without errors
   - [ ] ProtectedRoute correctly guards all dashboard routes
   - [ ] Login works for all 4 test accounts (admin, classrep, staff, pending)
   - [ ] Booking form availability check works and shows correct messages
   - [ ] Booking conflict detection works (try booking same resource/time twice)
   - [ ] Admin can approve and reject users — status updates in Manage Users
   - [ ] Notifications appear and can be marked as read
   - [ ] E-Library loads and is accessible without login
   - [ ] Staff can upload a material and it appears in My Uploads and E-Library
   - [ ] Admin analytics charts render with mock data
   - [ ] Attendance logging works on a past/today booking
   - [ ] All loading skeletons are visible during the mock delay (600ms)
   - [ ] All empty states are present
   - [ ] App is fully responsive on mobile screen sizes
   - [ ] Framer Motion animations run on every page
   - [ ] Black/white/gold design system is consistent throughout
   - [ ] Demo mode banner is visible at the bottom
   - [ ] .env is in .gitignore
```

---

## SWITCHING TO REAL BACKEND (when your partner is ready)

```
When the backend is built and running, switching is just 2 steps:

Step 1 — Update .env:
  VITE_USE_MOCK=false
  VITE_API_BASE_URL=https://your-real-backend-url.com/api

Step 2 — Restart the dev server:
  npm run dev

That's it. No code changes needed anywhere.
All pages and components will automatically start using real API calls
because everything goes through src/lib/apiService.ts.
```

---

*End of PAGES.md — Use prompts one at a time, always with PROMPT.md as context.*
