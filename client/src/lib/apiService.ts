import api from './axios'

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  register: (payload: any) =>
    api.post('/auth/register', payload).then(r => r.data),
  me: () =>
    api.get('/auth/me').then(r => r.data),
}

export const resourceService = {
  getAll: (params?: any) => {
    let apiParams = { ...params }
    if (apiParams.status) {
      if (apiParams.status === 'active') apiParams.status = 'available'
      else if (apiParams.status === 'inactive') apiParams.status = 'unavailable'
    }
    return api.get('/resources', { params: apiParams }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => {
        let status = item.status
        if (status === 'available') status = 'active'
        else if (status === 'unavailable') status = 'inactive'
        return { ...item, id: item._id, status }
      });
    })
  },
  create: async (payload: any) => {
    let imageLink = payload.image;
    if (payload.image instanceof File) {
      const formData = new FormData();
      formData.append('image', payload.image);
      const uploadRes = await api.post('/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      imageLink = uploadRes.data.imageUrl;
    }

    let apiPayload = { ...payload, image: imageLink }
    if (apiPayload.status) {
      if (apiPayload.status === 'active') apiPayload.status = 'available'
      else if (apiPayload.status === 'inactive') apiPayload.status = 'unavailable'
    }
    return api.post('/resources', apiPayload).then(r => {
      const item = r.data.data || r.data
      let status = item.status
      if (status === 'available') status = 'active'
      else if (status === 'unavailable') status = 'inactive'
      return { ...item, id: item._id, status }
    })
  },
  update: async (id: string, payload: any) => {
    let imageLink = payload.image;
    if (payload.image instanceof File) {
      const formData = new FormData();
      formData.append('image', payload.image);
      const uploadRes = await api.post('/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      imageLink = uploadRes.data.imageUrl;
    }

    let apiPayload = { ...payload, image: imageLink }
    if (apiPayload.status) {
      if (apiPayload.status === 'active') apiPayload.status = 'available'
      else if (apiPayload.status === 'inactive') apiPayload.status = 'unavailable'
    }
    return api.patch(`/resources/${id}`, apiPayload).then(r => {
      const item = r.data.data || r.data
      let status = item.status
      if (status === 'available') status = 'active'
      else if (status === 'unavailable') status = 'inactive'
      return { ...item, id: item._id, status }
    })
  },
  toggleStatus: (id: string, status: string) => {
    const mappedStatus = status === 'active' ? 'available' : status === 'inactive' ? 'unavailable' : status
    return api.patch(`/resources/${id}`, { status: mappedStatus }).then(r => {
      const item = r.data.data || r.data
      let resStatus = item.status
      if (resStatus === 'available') resStatus = 'active'
      else if (resStatus === 'unavailable') resStatus = 'inactive'
      return { ...item, id: item._id, status: resStatus }
    })
  },
  checkAvailability: (id: string, params: any) =>
    api.get(`/resources/${id}/availability`, { params }).then(r => r.data),
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
    api.get('/bookings', { params: mapQueryParams(params) }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map(mapBooking);
    }),
  getPublic: (params?: any) =>
    api.get('/bookings/public', { params: mapQueryParams(params) }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map(mapBooking);
    }),
  getById: (id: string) =>
    bookingService.getAll().then(bookings => {
      const found = bookings.find((b: any) => b.id === id);
      if (!found) {
        const err = new Error("Booking not found") as any;
        err.response = { status: 404, data: { message: "Booking not found" } };
        throw err;
      }
      return found;
    }),
  create: (payload: any) => {
    const apiPayload = { ...payload }
    if (apiPayload.resourceId) {
      apiPayload.resource = apiPayload.resourceId
      delete apiPayload.resourceId
    }
    return api.post('/bookings', apiPayload).then(r => mapBooking(r.data.data || r.data))
  },
  update: (id: string, payload: any) => {
    const apiPayload = { ...payload }
    if (apiPayload.resourceId) {
      apiPayload.resource = apiPayload.resourceId
      delete apiPayload.resourceId
    }
    return api.patch(`/bookings/${id}`, apiPayload).then(r => mapBooking(r.data.data || r.data))
  },
  cancel: (id: string) =>
    api.patch(`/bookings/cancel/${id}`).then(r => mapBooking(r.data.data || r.data)),
  logAttendance: (id: string, attendance: number) =>
    api.patch(`/bookings/${id}`, { attendance }).then(r => mapBooking(r.data.data || r.data)),
  delete: (id: string) =>
    api.delete(`/bookings/${id}`).then(r => r.data),
}

export const notificationService = {
  getAll: (params?: any) => {
    const { page, limit } = params || {}
    const apiParams = { page, limit }
    return api.get('/notifications', { params: apiParams }).then(r => {
      const data = r.data.data || r.data || []
      let readIds: string[] = []
      try {
        const stored = localStorage.getItem('rm_read_notification_ids')
        if (stored) {
          readIds = JSON.parse(stored)
        }
      } catch (e) {
        console.error('Failed to parse read notification IDs', e)
      }
      let mapped = data.map((item: any) => ({
        ...item,
        id: item._id,
        timestamp: item.createdAt || item.timestamp || new Date().toISOString(),
        read: readIds.includes(item._id)
      }))
      if (params?.unread) {
        mapped = mapped.filter((item: any) => !item.read)
      }
      if (params?.limit) {
        mapped = mapped.slice(0, params.limit)
      }
      return mapped
    })
  },
  markRead: (id: string) => {
    try {
      const stored = localStorage.getItem('rm_read_notification_ids')
      let readIds: string[] = stored ? JSON.parse(stored) : []
      if (!readIds.includes(id)) {
        readIds.push(id)
        localStorage.setItem('rm_read_notification_ids', JSON.stringify(readIds))
      }
    } catch (e) {
      console.error('Failed to save read notification ID', e)
    }
    return Promise.resolve({ success: true, message: "Marked as read locally." })
  },
  markAllRead: () => {
    return notificationService.getAll({ limit: 1000 }).then(notifs => {
      try {
        const stored = localStorage.getItem('rm_read_notification_ids')
        let readIds: string[] = stored ? JSON.parse(stored) : []
        notifs.forEach((n: any) => {
          if (!readIds.includes(n.id)) {
            readIds.push(n.id)
          }
        });
        localStorage.setItem('rm_read_notification_ids', JSON.stringify(readIds))
      } catch (e) {
        console.error('Failed to save read notification IDs', e)
      }
      return { success: true, message: "All marked as read locally." }
    })
  },
  pushClassUpdate: (payload: any) =>
    api.post('/notifications/class-update', payload).then(r => r.data),
}

export const libraryService = {
  getAll: (params?: any) =>
    api.get('/library', { params }).then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => ({ ...item, id: item._id }));
    }),
  getById: (id: string) =>
    api.get(`/library/${id}`).then(r => {
      const item = r.data.data || r.data;
      return { ...item, id: item._id || item.id };
    }),
  getStaffLibrary: () =>
    api.get('/library/staff').then(r => {
      const data = r.data.data || r.data || [];
      return data.map((item: any) => ({ ...item, id: item._id }));
    }),
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/library/upload-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  create: (payload: any) =>
    api.post('/library', payload).then(r => r.data),
  update: (id: string, payload: any) =>
    api.patch(`/library/${id}`, payload).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/library/${id}`).then(r => r.data),
  downloadFile: (fileUrl: string) => {
    const url = `/library/download-file?fileUrl=${encodeURIComponent(fileUrl)}`
    return api.get(url, { responseType: 'blob' }).then(r => r.data)
  }
}

export const userService = {
  getAll: (params?: any) =>
    api.get('/users', { params }).then(r => {
      const usersRaw = r.data.users || r.data.data || [];
      const users = usersRaw.map((u: any) => ({ ...u, id: u._id }));
      return { users, pagination: r.data.pagination };
    }),
  approve: (id: string) =>
    api.patch(`/users/${id}/approve`).then(r => r.data.data || r.data),
  reject: (id: string) =>
    api.patch(`/users/${id}/reject`).then(r => r.data.data || r.data),
  revoke: (id: string) =>
    api.patch(`/users/${id}/revoke`).then(r => r.data.data || r.data),
}

export const adminService = {
  getStats: () =>
    api.get('/admin/stats').then(r => r.data.data || r.data),
  getByDepartment: () =>
    api.get('/admin/analytics/by-department').then(r => r.data.data || r.data),
  getPeakHours: () =>
    api.get('/admin/analytics/peak-hours').then(r => r.data.data || r.data),
  getActivity: (params?: any) =>
    api.get('/admin/activity', { params }).then(r => {
      const data = r.data.data || r.data || [];
      const mapped = data.map((item: any) => ({ ...item, id: item._id }));
      return {
        data: mapped,
        pagination: r.data.pagination || null
      };
    }),
}