import { useEffect, useState } from 'react'
import { supabase } from './src/lib/supabase'
import { LoginScreen } from './src/screens/LoginScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { RoutineDetailScreen } from './src/screens/RoutineDetailScreen'

type Screen = 'login' | 'home' | 'routineDetail'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [routineId, setRoutineId] = useState<string | null>(null)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setScreen('home')
    }
  }

  function handleLogin() {
    setScreen('home')
  }

  function handleLogout() {
    supabase.auth.signOut()
    setScreen('login')
  }

  function handleNavigateToRoutine(id: string) {
    setRoutineId(id)
    setScreen('routineDetail')
  }

  switch (screen) {
    case 'login':
      return <LoginScreen onLogin={handleLogin} />
    case 'home':
      return (
        <HomeScreen
          onNavigateToRoutine={handleNavigateToRoutine}
          onLogout={handleLogout}
        />
      )
    case 'routineDetail':
      return (
        <RoutineDetailScreen
          routineId={routineId!}
          onBack={() => setScreen('home')}
        />
      )
  }
}
