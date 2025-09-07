import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Ticket Agent</h1>
            <div className="flex space-x-2">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/">Dashboard</Link>
              </Button>
              <Button
                variant={isActive('/ticket-mappings') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/ticket-mappings">Ticket Mappings</Link>
              </Button>
              <Button
                variant={isActive('/device-logs') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/device-logs">Device Logs</Link>
              </Button>
              <Button
                variant={isActive('/tickets') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/tickets">Tickets</Link>
              </Button>
              <Button
                variant={isActive('/esim-profiles') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/esim-profiles">ESim Profiles</Link>
              </Button>
              <Button
                variant={isActive('/setup') ? 'default' : 'ghost'}
                asChild
              >
                <Link to="/setup">Setup</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}