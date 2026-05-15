export type UserRole = 'classrep' | 'staff' | 'admin'
export type UserStatus = 'pending' | 'approved' | 'rejected'
export type BookingStatus = 'confirmed' | 'cancelled'
export type ResourceStatus = 'active' | 'inactive'
export type ResourceType = 'lab' | 'seminar' | 'hall' | 'equipment' | 'meeting'
export type NotificationType =
  | 'booking_confirmed' | 'registration_approved' | 'registration_rejected'
  | 'class_update' | 'auto_reminder' | 'system'
export type Department =
  | 'computer science' | 'cyber security' | 'information system'

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
