'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dumbbell, CalendarDays, Users, LogOut, Copy, Library } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Inicio', icon: Dumbbell },
  { href: '/dashboard/calendar', label: 'Calendario', icon: CalendarDays },
  { href: '/dashboard/copy-routine', label: 'Copiar', icon: Copy },
  { href: '/dashboard/exercises', label: 'Ejercicios', icon: Library },
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg gradient-text">Seals Program</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`gap-1.5 transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Button>
              </Link>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-muted-foreground hover:text-destructive transition-colors ml-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
