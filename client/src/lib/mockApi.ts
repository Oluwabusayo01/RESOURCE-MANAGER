import type { Resource, Booking, Notification, LibraryMaterial, UserRole, UserStatus, ResourceStatus, NotificationType, Department } from '../types'

// Helper to simulate network delay
const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms))

export const MOCK_DB = {
  users: [
    { id: 'u1', name: 'Chukwuemeka Obi', email: 'emeka@fci.edu', password: 'password123', role: 'classrep' as UserRole, department: 'computer science' as Department, status: 'approved' as UserStatus },
    { id: 'u2', name: 'Dr. Aisha Bello', email: 'aisha@fci.edu', password: 'password123', role: 'staff' as UserRole, department: 'cyber security' as Department, status: 'approved' as UserStatus },
    { id: 'u3', name: 'Tunde Fashola', email: 'tunde@fci.edu', password: 'password123', role: 'classrep' as UserRole, department: 'information systems sciences (ins)' as Department, status: 'pending' as UserStatus },
    { id: 'u4', name: 'Prof. Kamoru Adeyemi', email: 'kamoru@fci.edu', password: 'password123', role: 'staff' as UserRole, department: 'computer science' as Department, status: 'pending' as UserStatus },
    { id: 'admin', name: 'Faculty Admin', email: 'admin@fci.lautech.edu.ng', password: 'admin1234', role: 'admin' as UserRole, department: 'computer science' as Department, status: 'approved' as UserStatus },
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
  ] as Resource[],

  bookings: [
    { id: 'b1', resourceId: 'r1', resource: { id: 'r1', name: 'Computer Lab A', type: 'lab', capacity: 40, status: 'active' }, userId: 'u1', user: { id: 'u1', name: 'Chukwuemeka Obi', role: 'classrep', department: 'computer science' }, course: 'CSC 401 - Software Engineering', notes: 'Practical session', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '11:00', status: 'confirmed', attendance: 35, department: 'computer science', createdAt: new Date().toISOString() },
    { id: 'b2', resourceId: 'r4', resource: { id: 'r4', name: 'Seminar Room 1', type: 'seminar', capacity: 60, status: 'active' }, userId: 'u2', user: { id: 'u2', name: 'Dr. Aisha Bello', role: 'staff', department: 'cyber security' }, course: 'CYB 301 - Network Security', notes: '', date: new Date().toISOString().split('T')[0], startTime: '13:00', endTime: '15:00', status: 'confirmed', attendance: null, department: 'cyber security', createdAt: new Date().toISOString() },
    { id: 'b3', resourceId: 'r2', resource: { id: 'r2', name: 'Computer Lab B', type: 'lab', capacity: 40, status: 'active' }, userId: 'u1', user: { id: 'u1', name: 'Chukwuemeka Obi', role: 'classrep', department: 'computer science' }, course: 'CSC 305 - Database Systems', notes: '', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], startTime: '10:00', endTime: '12:00', status: 'confirmed', attendance: null, department: 'computer science', createdAt: new Date().toISOString() },
  ] as Booking[],

  notifications: [
    { id: 'n1', type: 'booking_confirmed', message: 'Your booking for Computer Lab A (CSC 401) has been confirmed.', timestamp: new Date().toISOString(), read: false, userId: 'u1' },
    { id: 'n2', type: 'registration_approved', message: 'Your account has been approved. Welcome to RM!', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true, userId: 'u1' },
    { id: 'n3', type: 'booking_confirmed', message: 'Your booking for Seminar Room 1 (CYB 301) has been confirmed.', timestamp: new Date().toISOString(), read: false, userId: 'u2' },
  ] as Notification[],

  library: [
    { id: 'm1', title: 'Introduction to Algorithms', course: 'CSC 201', department: 'computer science', description: 'Comprehensive lecture notes covering sorting, searching, and complexity.', uploadedBy: 'Dr. Aisha Bello', uploadedById: 'u2', fileType: 'pdf', fileUrl: '#', createdAt: '2026-04-10T09:00:00Z' },
    { id: 'm2', title: 'Network Security Fundamentals', course: 'CYB 301', department: 'cyber security', description: 'Core concepts in network security and cryptography.', uploadedBy: 'Dr. Aisha Bello', uploadedById: 'u2', fileType: 'pdf', fileUrl: '#', createdAt: '2026-04-15T09:00:00Z' },
    { id: 'm3', title: 'Database Design Principles', course: 'CSC 305', department: 'computer science', description: 'ER diagrams, normalization, and SQL fundamentals.', uploadedBy: 'Dr. Aisha Bello', uploadedById: 'u2', fileType: 'pptx', fileUrl: '#', createdAt: '2026-04-20T09:00:00Z' },
  ] as LibraryMaterial[],

  activity: [
    { id: 'a1', type: 'booking_created', description: 'Chukwuemeka Obi booked Computer Lab A — CSC 401', timestamp: new Date().toISOString() },
    { id: 'a2', type: 'booking_created', description: 'Dr. Aisha Bello booked Seminar Room 1 — CYB 301', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 'a3', type: 'user_registered', description: 'Tunde Fashola registered as Class Rep (INS)', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'a4', type: 'user_registered', description: 'Prof. Kamoru Adeyemi registered as Staff (CS)', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ],
}

// AUTH
export const login = async (email: string, password: string) => {
  await delay()
  const user = MOCK_DB.users.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Invalid email or password.')
  const { password: _, ...userWithoutPassword } = user
  return { token: 'mock_token_' + Date.now(), user: userWithoutPassword }
}

export const register = async (payload: any) => {
  await delay()
  const newUser = {
    ...payload,
    id: 'u' + (MOCK_DB.users.length + 1),
    status: 'pending' as UserStatus,
  }
  MOCK_DB.users.push(newUser)
  return { message: 'Registration successful. Pending approval.' }
}

export const me = async () => {
  await delay()
  const userStr = localStorage.getItem('rm_user')
  return userStr ? JSON.parse(userStr) : null
}

// RESOURCES
export const getResources = async (params?: any) => {
  await delay()
  let resources = [...MOCK_DB.resources]
  if (params?.status) resources = resources.filter(r => r.status === params.status)
  return resources
}

export const createResource = async (payload: any) => {
  await delay()
  const newResource = { ...payload, id: 'r' + (MOCK_DB.resources.length + 1) }
  MOCK_DB.resources.push(newResource)
  return newResource
}

export const updateResource = async (id: string, payload: any) => {
  await delay()
  const index = MOCK_DB.resources.findIndex(r => r.id === id)
  if (index !== -1) {
    MOCK_DB.resources[index] = { ...MOCK_DB.resources[index], ...payload }
    return MOCK_DB.resources[index]
  }
  throw new Error('Resource not found')
}

export const toggleResourceStatus = async (id: string, status: string) => {
  await delay()
  const resource = MOCK_DB.resources.find(r => r.id === id)
  if (resource) {
    resource.status = status as ResourceStatus
    return resource
  }
  throw new Error('Resource not found')
}

export const checkAvailability = async (id: string, { date, startTime, endTime }: any) => {
  await delay()
  const conflict = MOCK_DB.bookings.find(b => 
    b.resourceId === id && 
    b.date === date && 
    b.status === 'confirmed' &&
    ((startTime >= b.startTime && startTime < b.endTime) || 
     (endTime > b.startTime && endTime <= b.endTime) ||
     (startTime <= b.startTime && endTime >= b.endTime))
  )
  return { available: !conflict }
}

// BOOKINGS
export const getBookings = async (params?: any) => {
  await delay()
  let bookings = [...MOCK_DB.bookings]
  if (params?.userId) bookings = bookings.filter(b => b.userId === params.userId)
  if (params?.date) {
      const targetDate = params.date === 'today' ? new Date().toISOString().split('T')[0] : params.date
      bookings = bookings.filter(b => b.date === targetDate)
  }
  if (params?.status) bookings = bookings.filter(b => b.status === params.status)
  if (params?.limit) bookings = bookings.slice(0, params.limit)
  return bookings
}

export const getBookingById = async (id: string) => {
  await delay()
  const booking = MOCK_DB.bookings.find(b => b.id === id)
  if (!booking) throw new Error('Booking not found')
  return booking
}

export const createBooking = async (payload: any) => {
  await delay()
  const { available } = await checkAvailability(payload.resourceId, payload)
  if (!available) throw new Error('This time slot is already taken. Please choose another.')
  
  const resource = MOCK_DB.resources.find(r => r.id === payload.resourceId)
  const newBooking: Booking = {
    ...payload,
    id: 'b' + (MOCK_DB.bookings.length + 1),
    resource: resource!,
    status: 'confirmed',
    attendance: null,
    createdAt: new Date().toISOString()
  }
  MOCK_DB.bookings.push(newBooking)
  
  MOCK_DB.activity.unshift({
    id: 'a' + (MOCK_DB.activity.length + 1),
    type: 'booking_created',
    description: `${payload.userName || 'Someone'} booked ${resource?.name} — ${payload.course}`,
    timestamp: new Date().toISOString()
  })

  return newBooking
}

export const cancelBooking = async (id: string) => {
  await delay()
  const booking = MOCK_DB.bookings.find(b => b.id === id)
  if (booking) {
    booking.status = 'cancelled'
    return booking
  }
  throw new Error('Booking not found')
}

export const logAttendance = async (id: string, attendance: number) => {
  await delay()
  const booking = MOCK_DB.bookings.find(b => b.id === id)
  if (booking) {
    booking.attendance = attendance
    return booking
  }
  throw new Error('Booking not found')
}

export const deleteBooking = async (id: string) => {
  await delay()
  const index = MOCK_DB.bookings.findIndex(b => b.id === id)
  if (index !== -1) {
    MOCK_DB.bookings.splice(index, 1)
    return { success: true }
  }
  throw new Error('Booking not found')
}

// NOTIFICATIONS
export const getNotifications = async (params?: any) => {
  await delay()
  let notifications = [...MOCK_DB.notifications]
  if (params?.userId) notifications = notifications.filter(n => n.userId === params.userId)
  if (params?.unread) notifications = notifications.filter(n => !n.read)
  if (params?.limit) notifications = notifications.slice(0, params.limit)
  return notifications
}

export const markNotificationRead = async (id: string) => {
  await delay()
  const n = MOCK_DB.notifications.find(n => n.id === id)
  if (n) n.read = true
  return { success: true }
}

export const markAllNotificationsRead = async () => {
  await delay()
  MOCK_DB.notifications.forEach(n => n.read = true)
  return { success: true }
}

export const pushClassUpdate = async (payload: any) => {
  await delay()
  const newNotif = {
    id: 'n' + (MOCK_DB.notifications.length + 1),
    type: 'class_update' as NotificationType,
    message: `[${payload.department}] Update: ${payload.title} - ${payload.message}`,
    timestamp: new Date().toISOString(),
    read: false,
    userId: 'u1' // In reality, push to all users in dept
  }
  MOCK_DB.notifications.unshift(newNotif)
  return newNotif
}

// LIBRARY
export const getLibrary = async (params?: any) => {
  await delay()
  let library = [...MOCK_DB.library]
  if (params?.department && params.department !== 'All') {
    library = library.filter(m => m.department === params.department)
  }
  if (params?.search) {
    const s = params.search.toLowerCase()
    library = library.filter(m => m.title.toLowerCase().includes(s) || m.course.toLowerCase().includes(s))
  }
  return library
}

export const uploadMaterial = async (formData: FormData) => {
  await delay()
  const title = formData.get('title') as string
  const course = formData.get('course') as string
  const department = formData.get('department') as Department
  const uploadedBy = formData.get('uploadedBy') as string
  const uploadedById = formData.get('uploadedById') as string
  
  const newMaterial: LibraryMaterial = {
    id: 'm' + (MOCK_DB.library.length + 1),
    title,
    course,
    department,
    description: formData.get('description') as string,
    uploadedBy,
    uploadedById,
    fileType: 'pdf', // Mock
    fileUrl: '#',
    createdAt: new Date().toISOString()
  }
  MOCK_DB.library.unshift(newMaterial)
  return newMaterial
}

export const downloadMaterial = async (_id: string) => {
  await delay()
  return { fileUrl: '#' }
}

export const deleteMaterial = async (id: string) => {
  await delay()
  const index = MOCK_DB.library.findIndex(m => m.id === id)
  if (index !== -1) {
    MOCK_DB.library.splice(index, 1)
    return { success: true }
  }
  throw new Error('Material not found')
}

// ADMIN & USERS
export const getUsers = async (params?: any) => {
  await delay()
  let users = MOCK_DB.users.filter(u => u.role !== 'admin')
  if (params?.role) users = users.filter(u => u.role === params.role)
  if (params?.department) users = users.filter(u => u.department === params.department)
  if (params?.status) users = users.filter(u => u.status === params.status)

  const page = parseInt(params?.page) || 1
  const limit = parseInt(params?.limit) || 10
  const skip = (page - 1) * limit
  const totalUsers = users.length
  const paginatedUsers = users.slice(skip, skip + limit)

  return {
    users: paginatedUsers,
    pagination: {
      totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
      hasNextPage: page * limit < totalUsers
    }
  }
}

export const approveUser = async (id: string) => {
  await delay()
  const user = MOCK_DB.users.find(u => u.id === id)
  if (user) {
    user.status = 'approved'
    return user
  }
  throw new Error('User not found')
}

export const rejectUser = async (id: string) => {
  await delay()
  const user = MOCK_DB.users.find(u => u.id === id)
  if (user) {
    user.status = 'rejected'
    return user
  }
  throw new Error('User not found')
}

export const getAdminStats = async () => {
  await delay()
  const mostBooked = MOCK_DB.bookings.reduce((acc: any, b) => {
    acc[b.resource.name] = (acc[b.resource.name] || 0) + 1
    return acc
  }, {})
  const mostBookedName = Object.keys(mostBooked).reduce((a, b) => mostBooked[a] > mostBooked[b] ? a : b, 'N/A')

  return {
    totalBookings: MOCK_DB.bookings.length,
    pendingUsers: MOCK_DB.users.filter(u => u.status === 'pending').length,
    totalUsers: MOCK_DB.users.length,
    mostBookedResource: mostBookedName
  }
}

export const getBookingsByDepartment = async () => {
  await delay()
  const depts = ['computer science', 'cyber security', 'information systems sciences (ins)']
  return depts.map(d => ({
    department: d,
    count: MOCK_DB.bookings.filter(b => b.department === d).length
  }))
}

export const getPeakHours = async () => {
  await delay()
  return [
    { hour: '08:00', count: 2 },
    { hour: '09:00', count: 5 },
    { hour: '10:00', count: 8 },
    { hour: '11:00', count: 6 },
    { hour: '12:00', count: 4 },
    { hour: '13:00', count: 7 },
    { hour: '14:00', count: 9 },
    { hour: '15:00', count: 5 },
    { hour: '16:00', count: 3 },
    { hour: '17:00', count: 1 },
  ]
}

export const getActivity = async (params?: any) => {
  await delay()
  let activity = [...MOCK_DB.activity]
  if (params?.limit) activity = activity.slice(0, params.limit)
  return activity
}
