"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function LoginForm() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      setIsLoading(true)
      console.log("Attempting sign in...")
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      console.log("Sign in result:", result)

      if (result?.error) {
        console.error("Sign in error:", result.error)
        setError("Invalid email or password")
      } else {
        console.log("Sign in success, redirecting...")
        router.push("/lessons")
        router.refresh()
      }
    } catch (err) {
      console.error("Sign in exception:", err)
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Logo Circle */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-[70px] h-[70px] rounded-full shadow-lg" style={{
        background: 'rgb(var(--primary))',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <GraduationCap className="h-8 w-8 text-white" />
      </div>

      <Card className="w-full border-none shadow-2xl backdrop-blur-md pt-8" style={{
        background: isDark ? 'var(--gradient-paper-dark)' : 'var(--gradient-paper)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
      }}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold gradient-text">Connexion</CardTitle>
          <CardDescription>Entrez vos identifiants pour accéder à votre compte.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 rounded-xl bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 rounded-xl bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <span
                    onClick={() => router.push('/forgot-password')}
                    className="text-xs text-primary hover:underline cursor-pointer font-medium"
                  >
                    Mot de passe oublié ?
                  </span>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button type="submit" className="w-full rounded-xl py-6 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8">
          <Button
            variant="outline"
            className="w-full rounded-xl hover:bg-background/50"
            onClick={() => router.push('/register')}
          >
            Créer un compte gratuit
          </Button>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-muted-foreground font-medium">
                Ou continuer avec
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-xl hover:bg-background/50" onClick={() => signIn("google")}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <button
              onClick={() => router.push('/register')}
              className="text-primary hover:underline font-medium"
            >
              S'inscrire
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

