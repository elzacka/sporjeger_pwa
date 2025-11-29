import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true
  })

  useEffect(() => {
    // Hent navaerende sesjon
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false
      })
    })

    // Lytt pa auth-endringer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false
        })

        // Redirect til admin etter vellykket innlogging
        // (Supabase stripper hash-fragmenter, sa vi ma gjore det manuelt)
        if (event === 'SIGNED_IN' && session) {
          const currentHash = window.location.hash
          if (!currentHash || currentHash === '#/' || currentHash === '#') {
            window.location.hash = '#/admin'
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Logg inn med magic link
  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/admin`
      }
    })
    return { error }
  }

  // Logg ut
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    signInWithEmail,
    signOut
  }
}
