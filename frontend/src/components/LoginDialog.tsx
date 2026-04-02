'use client'

import { useState } from 'react'
import { LogIn, X, ShieldCheck, ArrowRight } from 'lucide-react'

interface LoginDialogProps {
  children: React.ReactNode // trigger button
}

export function LoginDialog({ children }: LoginDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6)' }}>
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Đăng nhập</h2>
              <p className="text-sm text-gray-500 mt-1 text-center">
                Đăng nhập để truy cập đầy đủ tính năng
              </p>
            </div>

            {/* Login button → mở popup */}
            <button
              onClick={() => {
                const w = 480, h = 620
                const left = window.screenX + (window.outerWidth - w) / 2
                const top = window.screenY + (window.outerHeight - h) / 2
                const popup = window.open(
                  '/auth/login',
                  'login',
                  `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
                )
                // Sau khi popup đóng → reload để cập nhật session
                const timer = setInterval(() => {
                  if (popup?.closed) {
                    clearInterval(timer)
                    setOpen(false)
                    window.location.reload()
                  }
                }, 500)
              }}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-white text-sm
                bg-gradient-to-r from-[#0f766e] to-[#14b8a6]
                shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35
                hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập với tài khoản
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Bảo mật bởi OpenID Connect · Cửa sổ popup
            </p>
          </div>
        </div>
      )}
    </>
  )
}
