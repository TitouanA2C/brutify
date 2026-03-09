"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BrutifyLogo } from "@/components/ui/BrutifyLogo"
import { Input } from "@/components/ui"
import { Loading } from "@/components/ui/Loading"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push("/onboarding")
    router.refresh()
  }

  const handleGoogleSignup = async () => {
    setError(null)
    setGoogleLoading(true)

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "")
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setGoogleLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.85, filter: "blur(20px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[420px]"
    >
      <div className="rounded-2xl border border-brutify-gold/20 bg-[#111113]/80 backdrop-blur-xl p-5 sm:p-8 shadow-[0_0_40px_rgba(255,171,0,0.15),0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col items-center gap-2 mb-8">
          <BrutifyLogo size="lg" />
          <p className="text-sm text-brutify-text-secondary font-body">
            Crée ton compte. Domine ta niche.
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <Input
              id="fullName"
              label="Nom complet"
              type="text"
              placeholder="Jean Dupont"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="jean@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="relative">
            <Input
              id="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-brutify-text-muted hover:text-brutify-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-brutify-danger font-body"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.60, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-2 w-full rounded-xl bg-gold-gradient px-5 py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_50px_rgba(255,171,0,0.3)] hover:shadow-[0_0_70px_rgba(255,171,0,0.5)] transition-shadow duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loading variant="icon" size="sm" className="h-4 w-4" />
            ) : (
              "Créer mon compte"
            )}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-white/[0.06]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#111113] px-3 text-xs text-brutify-text-muted font-body">
              ou
            </span>
          </div>
        </div>

        <motion.button
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
        >
          {googleLoading ? (
            <Loading variant="icon" size="sm" className="h-4 w-4" />
          ) : (
            <>
              <GoogleIcon />
              Continuer avec Google
            </>
          )}
        </motion.button>

        <p className="mt-6 text-center text-sm text-brutify-text-secondary font-body">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="relative text-brutify-gold hover:text-brutify-gold-light transition-colors font-semibold group"
          >
            Se connecter
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-brutify-gold to-brutify-gold-light group-hover:w-full transition-all duration-300 ease-out" />
          </Link>
        </p>
      </div>
    </motion.div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
