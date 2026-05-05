import { Link, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import Navbar from './Navbar'

export default function PublicLayout() {
  const { user } = useAuthStore()
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <Link to="/" className="flex items-center gap-1 mb-6">
                <span className="text-3xl font-black text-white">RM</span>
                <span className="text-xs font-bold text-gold ml-1 border-l border-mid-gray pl-2">
                  FCI LAUTECH
                </span>
              </Link>
              <p className="text-sm text-mid-gray leading-relaxed max-w-xs">
                Efficiently managing the resources of the Faculty of Computing and Informatics, LAUTECH.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold text-gold uppercase tracking-widest text-xs mb-2">Quick Links</h5>
              <Link to="/" className="text-sm hover:text-gold transition-colors text-white">Home</Link>
              <Link to="/schedule" className="text-sm hover:text-gold transition-colors text-white">Schedule</Link>
              <Link to="/library" className="text-sm hover:text-gold transition-colors text-white">E-Library</Link>
              {!user ? (
                <Link to="/login" className="text-sm hover:text-gold transition-colors text-white">Login</Link>
              ) : (
                <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'staff' ? '/staff/dashboard' : '/classrep/dashboard'} className="text-sm hover:text-gold transition-colors text-white">Dashboard</Link>
              )}
            </div>
            <div>
              <h5 className="font-bold text-gold uppercase tracking-widest text-xs mb-4">Contact Info</h5>
              <p className="text-sm text-mid-gray mb-2">Faculty of Computing and Informatics</p>
              <p className="text-sm text-mid-gray mb-2">Ladoke Akintola University of Technology</p>
              <p className="text-sm text-mid-gray">Ogbomoso, Nigeria</p>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-mid-gray">
            <p>© {new Date().getFullYear()} FCI LAUTECH. All rights reserved.</p>
            <p>Designed with ❤️ for FCI</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
