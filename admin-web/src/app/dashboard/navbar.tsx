'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dumbbell, CalendarDays, Users, LogOut, Copy } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Inicio', icon: Dumbbell },
  { href: '/dashboard/calendar', label: 'Calendario', icon: CalendarDays },
  { href: '/dashboard/copy-routine', label: 'Copiar Rutina', icon: Copy },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Dumbbell className="h-5 w-5" />
          Seals Program
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href}>
                <Button variant={isActive ? 'secondary' : 'ghost'} size="sm" className="gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Button>
              </Link>
            )
          })}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
