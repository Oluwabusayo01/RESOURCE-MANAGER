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
  getAll: (params?: any) => {
    let apiParams = { ...params }
    if (apiParams.status) {
      if (apiParams.status === 'active') apiParams.status = 'available'
      else if (apiParams.status === 'inactive') apiParams.status = 'unavailable'
    }
    return USE_MOCK ? mock.getResources(params) : api.get('/resources', { params: apiParams }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => {
        let status = item.status
        if (status === 'available') status = 'active'
        else if (status === 'unavailable') status = 'inactive'
        return { ...item, id: item._id, status }
      });
    })
  },
  create: (payload: any) => {
    let apiPayload = { ...payload }
    if (apiPayload.status) {
      if (apiPayload.status === 'active') apiPayload.status = 'available'
      else if (apiPayload.status === 'inactive') apiPayload.status = 'unavailable'
    }
    return USE_MOCK ? mock.createResource(payload) : api.post('/resources', apiPayload).then(r => {
      const item = r.data.data || r.data
      let status = item.status
      if (status === 'available') status = 'active'
      else if (status === 'unavailable') status = 'inactive'
      return { ...item, id: item._id, status }
    })
  },
  update: (id: string, payload: any) => {
    let apiPayload = { ...payload }
    if (apiPayload.status) {
      if (apiPayload.status === 'active') apiPayload.status = 'available'
      else if (apiPayload.status === 'inactive') apiPayload.status = 'unavailable'
    }
    return USE_MOCK ? mock.updateResource(id, payload) : api.patch(`/resources/${id}`, apiPayload).then(r => {
      const item = r.data.data || r.data
      let status = item.status
      if (status === 'available') status = 'active'
      else if (status === 'unavailable') status = 'inactive'
      return { ...item, id: item._id, status }
    })
  },
  toggleStatus: (id: string, status: string) => {
    const mappedStatus = status === 'active' ? 'available' : status === 'inactive' ? 'unavailable' : status
    return USE_MOCK ? mock.toggleResourceStatus(id, status) : api.patch(`/resources/${id}`, { status: mappedStatus }).then(r => {
      const item = r.data.data || r.data
      let resStatus = item.status
      if (resStatus === 'available') resStatus = 'active'
      else if (resStatus === 'unavailable') resStatus = 'inactive'
      return { ...item, id: item._id, status: resStatus }
    })
  },
  checkAvailability: (id: string, params: any) =>
    USE_MOCK ? mock.checkAvailability(id, params) : api.get(`/resources/${id}/availability`, { params }).then(r => r.data),
}

const mapBooking = (item: any): any => {
  if (!item) return item
  const resourceId = item.resource && typeof item.resource === 'object' 
    ? (item.resource._id || item.resource.id) 
    : item.resource
  const userId = item.user && typeof item.user === 'object' 
    ? (item.user._id || item.user.id) 
    : item.user
  
  let resource = item.resource
  if (resource && typeof resource === 'object') {
    let resStatus = resource.status
    if (resStatus === 'available') resStatus = 'active'
    else if (resStatus === 'unavailable') resStatus = 'inactive'
    resource = {
      ...resource,
      id: resource._id || resource.id,
      status: resStatus
    }
  }

  return {
    ...item,
    id: item._id || item.id,
    resourceId,
    userId,
    resource
  }
}

const mapQueryParams = (params?: any) => {
  if (!params) return params
  const mapped = { ...params }
  if (mapped.resourceId) {
    mapped.resource = mapped.resourceId
    delete mapped.resourceId
  }
  if (mapped.userId) {
    mapped.user = mapped.userId
    delete mapped.userId
  }
  
  // Clean undefined, null, or empty string params
  Object.keys(mapped).forEach(key => {
    if (mapped[key] === undefined || mapped[key] === null || mapped[key] === '') {
      delete mapped[key]
    }
  })
  
  return mapped
}

export const bookingService = {
  getAll: (params?: any) =>
    USE_MOCK ? mock.getBookings(params) : api.get('/bookings', { params: mapQueryParams(params) }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map(mapBooking);
    }),
  getPublic: (params?: any) =>
    USE_MOCK ? mock.getBookings(params) : api.get('/bookings/public', { params: mapQueryParams(params) }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map(mapBooking);
    }),
  getById: (id: string) =>
    USE_MOCK ? mock.getBookingById(id) : api.get(`/bookings/${id}`).then(r => mapBooking(r.data.data || r.data)),
  create: (payload: any) => {
    const apiPayload = { ...payload }
    if (apiPayload.resourceId) {
      apiPayload.resource = apiPayload.resourceId
      delete apiPayload.resourceId
    }
    return USE_MOCK ? mock.createBooking(payload) : api.post('/bookings', apiPayload).then(r => mapBooking(r.data.data || r.data))
  },
  update: (id: string, payload: any) => {
    const apiPayload = { ...payload }
    if (apiPayload.resourceId) {
      apiPayload.resource = apiPayload.resourceId
      delete apiPayload.resourceId
    }
    return USE_MOCK ? mock.updateBooking(id, payload) : api.patch(`/bookings/${id}`, apiPayload).then(r => mapBooking(r.data.data || r.data))
  },
  cancel: (id: string) =>
    USE_MOCK ? mock.cancelBooking(id) : api.patch(`/bookings/cancel/${id}`).then(r => mapBooking(r.data.data || r.data)),
  logAttendance: (id: string, attendance: number) =>
    USE_MOCK ? mock.logAttendance(id, attendance) : api.patch(`/bookings/${id}`, { attendance }).then(r => mapBooking(r.data.data || r.data)),
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
