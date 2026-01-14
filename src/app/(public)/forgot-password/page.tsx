"use client"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { useTheme } from "@/components/theme-provider"

export default function ForgotPasswordPage() {
  const { isDark } = useTheme()

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-16 relative overflow-hidden" style={{
      background: isDark
        ? 'linear-gradient(135deg, rgba(26, 32, 39, 0.95) 0%, rgba(18, 18, 18, 0.98) 100%)'
        : 'linear-gradient(135deg, rgba(245, 247, 250, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%)'
    }}>
      {/* Decorative Elements */}
      <div
        className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'rgb(var(--primary))' }}
      />
      <div
        className="absolute -bottom-[150px] -left-[150px] w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'rgb(var(--secondary))' }}
      />

      <div className="relative z-10 w-full max-w-[400px]">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
