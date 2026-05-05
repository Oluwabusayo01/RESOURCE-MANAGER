import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-8 border-t bg-light-gray">
        <div className="container mx-auto px-4 text-center text-dark-gray text-sm">
          © {new Date().getFullYear()} Faculty of Computing and Informatics, LAUTECH. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
