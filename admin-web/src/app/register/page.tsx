'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.user?.id) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        role: 'user',
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5 pointer-events-none" />
        <div className="w-full max-w-md relative text-center">
          <div className="glass rounded-2xl p-8 glow">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 items-center justify-center shadow-2xl shadow-green-500/20 mb-4">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">¡Registrado!</h2>
            <p className="text-muted-foreground mb-6">Tu cuenta fue creada exitosamente. Ya puedes iniciar sesión.</p>
            <Link href="/login">
              <Button className="w-full h-11 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20">
                Ir a iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 items-center justify-center shadow-2xl shadow-primary/20 mb-4">
            <Dumbbell className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Seals Program</h1>
          <p className="text-muted-foreground mt-2">Crear cuenta nueva</p>
        </div>

        <div className="glass rounded-2xl p-8 glow">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Nombre</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" required className="bg-secondary/50 border-border focus:border-primary/50 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-secondary/50 border-border focus:border-primary/50 transition-colors" placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Contraseña</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="bg-secondary/50 border-border focus:border-primary/50 transition-colors" placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
            <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ¿Ya tienes cuenta? <span className="text-primary font-medium">Inicia sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
