"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Tables } from "@/lib/supabase/types"

type Profile = Tables<"profiles">

interface UserContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

const log = (msg: string, extra?: Record<string, unknown>) =>
  console.log(`[UserProvider] ${msg}`, extra ? JSON.stringify(extra) : "")

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useRef(createClient()).current
  const userRef = useRef<User | null>(null)
  const profileRef = useRef<Profile | null>(null)
  const mountedRef = useRef(true)
  const initDone = useRef(false)

  const fetchProfileFromApi = useCallback(async (): Promise<Profile | null> => {
    try {
      const res = await fetch("/api/profile")
      if (!res.ok) return null
      const data = await res.json()
      const p = data.profile as Profile | null
      if (p && mountedRef.current) {
        setProfile(p)
        profileRef.current = p
        log("profile loaded from API", { plan: p.plan })
        return p
      }
      return null
    } catch {
      return null
    }
  }, [])

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (data) {
        log("profile loaded", { attempt, userId: userId.slice(0, 8) })
        if (mountedRef.current) {
          setProfile(data)
          profileRef.current = data
        }
        return data
      }

      if (error) {
        log("fetchProfile error", { attempt, code: error.code, message: error.message })
      }

      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 500))
      }
    }

    log("fetchProfile FAILED, falling back to API")
    return fetchProfileFromApi()
  }, [supabase, fetchProfileFromApi])

  useEffect(() => {
    mountedRef.current = true

    const init = async () => {
      if (initDone.current) return
      initDone.current = true

      log("init start")

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        log("getSession error", { message: sessionError.message })
      }

      const currentUser = session?.user ?? null
      log("session resolved", { hasUser: !!currentUser, userId: currentUser?.id?.slice(0, 8) })

      if (!mountedRef.current) return

      userRef.current = currentUser
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id)
      }

      if (mountedRef.current) setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log("authStateChange", { event, hasSession: !!session })

        if (event === "INITIAL_SESSION") return

        const newUser = session?.user ?? null

        if (event === "SIGNED_OUT" || !newUser) {
          userRef.current = null
          profileRef.current = null
          if (mountedRef.current) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        userRef.current = newUser
        if (mountedRef.current) setUser(newUser)

        if (!profileRef.current || profileRef.current.id !== newUser.id) {
          await fetchProfile(newUser.id)
        }

        if (mountedRef.current) setLoading(false)
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // Safety net: si le profil est toujours null avec un user, charger via l'API serveur (plan correct en prod)
  useEffect(() => {
    if (profile || !user || loading) return

    log("safety net: profile null with user present, fetching from API")
    const timer = setTimeout(() => {
      if (!profileRef.current && userRef.current) {
        fetchProfileFromApi()
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [profile, user, loading, fetchProfileFromApi])

  const signOut = useCallback(async () => {
    const doRedirect = () => {
      userRef.current = null
      profileRef.current = null
      setUser(null)
      setProfile(null)
      window.location.replace("/login")
    }
    try {
      const timeout = setTimeout(doRedirect, 3000)
      await supabase.auth.signOut()
      clearTimeout(timeout)
      doRedirect()
    } catch (e) {
      console.warn("[UserProvider] signOut error", e)
      doRedirect()
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    const u = userRef.current
    if (!u) return
    const fromApi = await fetchProfileFromApi()
    if (!fromApi) await fetchProfile(u.id)
  }, [fetchProfileFromApi, fetchProfile])

  return (
    <UserContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within UserProvider")
  return ctx
}
