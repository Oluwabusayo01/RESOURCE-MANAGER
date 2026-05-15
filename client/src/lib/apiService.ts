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
    USE_MOCK ? mock.getResources(params) : api.get('/resources', { params }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => ({ ...item, id: item._id }));
    }),
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
    USE_MOCK ? mock.getBookings(params) : api.get('/bookings', { params }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => ({ ...item, id: item._id }));
    }),
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
    USE_MOCK ? mock.getNotifications(params) : api.get('/notifications', { params }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => ({ ...item, id: item._id }));
    }),
  markRead: (id: string) =>
    USE_MOCK ? mock.markNotificationRead(id) : api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    USE_MOCK ? mock.markAllNotificationsRead() : api.patch('/notifications/read-all').then(r => r.data),
  pushClassUpdate: (payload: any) =>
    USE_MOCK ? mock.pushClassUpdate(payload) : api.post('/notifications/class-update', payload).then(r => r.data),
}

export const libraryService = {
  getAll: (params?: any) =>
    USE_MOCK ? mock.getLibrary(params) : api.get('/library', { params }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => ({ ...item, id: item._id }));
    }),
  upload: (formData: FormData) =>
    USE_MOCK ? mock.uploadMaterial(formData) : api.post('/library', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  download: (id: string) =>
    USE_MOCK ? mock.downloadMaterial(id) : api.get(`/library/${id}/download`).then(r => r.data),
  delete: (id: string) =>
    USE_MOCK ? mock.deleteMaterial(id) : api.delete(`/library/${id}`).then(r => r.data),
}

export const userService = {
  getAll: (params?: any) =>
    USE_MOCK 
      ? mock.getUsers(params).then(res => ({
          users: res.users.map((u: any) => ({ ...u, id: u.id || u._id })),
          pagination: res.pagination
        }))
      : api.get('/users', { params }).then(r => {
          const usersRaw = r.data.users || r.data.data || [];
          const users = usersRaw.map((u: any) => ({ ...u, id: u._id }));
          return { users, pagination: r.data.pagination };
        }),
  approve: (id: string) =>
    USE_MOCK ? mock.approveUser(id) : api.patch(`/users/${id}/approve`).then(r => r.data.data || r.data),
  reject: (id: string) =>
    USE_MOCK ? mock.rejectUser(id) : api.patch(`/users/${id}/reject`).then(r => r.data.data || r.data),
}

export const adminService = {
  getStats: () =>
    USE_MOCK ? mock.getAdminStats() : api.get('/admin/stats').then(r => r.data.data || r.data),
  getByDepartment: () =>
    USE_MOCK ? mock.getBookingsByDepartment() : api.get('/admin/analytics/by-department').then(r => r.data.data || r.data),
  getPeakHours: () =>
    USE_MOCK ? mock.getPeakHours() : api.get('/admin/analytics/peak-hours').then(r => r.data.data || r.data),
  getActivity: (params?: any) =>
    USE_MOCK ? mock.getActivity(params) : api.get('/admin/activity', { params }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => ({ ...item, id: item._id }));
    }),
}
