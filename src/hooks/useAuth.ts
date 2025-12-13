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
    // Hent nåværende sesjon
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false
      })
    })

    // Lytt på auth-endringer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false
        })

        // Redirect til admin ved innlogging
        // Sjekk om vi nettopp kom fra OAuth callback (URL params eller manglende hash)
        const url = window.location.href
        const hasAuthParams = url.includes('access_token') || url.includes('code=')
        const isAtRoot = !window.location.hash || window.location.hash === '#/' || window.location.hash === ''

        if (event === 'SIGNED_IN' && session && (hasAuthParams || isAtRoot)) {
          window.location.hash = '#/admin'
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Logg inn med magic link
  const signInWithEmail = async (email: string) => {
    // Ikke bruk hash i redirect URL - Supabase legger til egne hash-fragmenter
    // SIGNED_IN event handler tar seg av redirect til #/admin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`
      }
    })
    return { error }
  }

  // Logg inn med GitHub
  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`
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
    signInWithGitHub,
    signOut
  }
}
