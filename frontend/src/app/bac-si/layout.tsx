'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { VersionDisplay } from '@/components/version-display'

const TopNavBar = dynamic(() => import('@/components/navbar/top-nav-bar'), { ssr: false })

export default function BacSiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <TopNavBar />
      <main className="flex-1">{children}</main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Tri Thức Sản Khoa. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <VersionDisplay />
        </nav>
      </footer>
    </div>
  )
}
