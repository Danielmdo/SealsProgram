'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCog, User, ShieldAlert, Star } from 'lucide-react'

type Profile = {
  id: string
  name: string
  role: string
  super_admin: boolean
  trainer_id: string | null
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setCurrentUser(myProfile)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    loadUsers()
  }

  const toggleSuperAdmin = async (userId: string, isSuper: boolean) => {
    if (!confirm(`${isSuper ? 'Quitar' : 'Asignar'} super admin a este usuario?`)) return
    await supabase.from('profiles').update({ super_admin: !isSuper }).eq('id', userId)
    loadUsers()
  }

  const isSuperAdmin = currentUser?.super_admin === true

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm">
          {isSuperAdmin
            ? 'Gestiona todos los usuarios y sus roles'
            : 'Usuarios asignados a tu entrenamiento'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isSuperAdmin ? 'Todos los usuarios' : 'Mis usuarios'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay usuarios registrados</p>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center gap-3">
                    {u.super_admin ? (
                      <ShieldAlert className="h-5 w-5 text-yellow-500" />
                    ) : u.role === 'admin' ? (
                      <UserCog className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{u.name || 'Sin nombre'}</p>
                        {u.super_admin && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full font-medium">
                            Super Admin
                          </span>
                        )}
                        {u.role === 'admin' && !u.super_admin && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            Admin
                          </span>
                        )}
                        {u.role === 'user' && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Usuario
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSuperAdmin && u.id !== currentUser?.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRole(u.id, u.role)}
                      >
                        {u.role === 'admin' ? 'Hacer usuario' : 'Hacer admin'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSuperAdmin(u.id, u.super_admin)}
                      >
                        {u.super_admin ? 'Quitar super admin' : 'Hacer super admin'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
