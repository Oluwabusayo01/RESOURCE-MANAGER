import { create } from 'zustand'
import type { Booking } from '../types'

interface BookingState {
  bookings: Booking[]
  loading: boolean
  setBookings: (bookings: Booking[]) => void
  setLoading: (loading: boolean) => void
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  loading: false,
  setBookings: (bookings) => set({ bookings }),
  setLoading: (loading) => set({ loading }),
}))
