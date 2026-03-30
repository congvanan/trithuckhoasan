import { NavbarServer } from '@/components/navbar/NavbarServer'
import { NavbarSkeleton } from '@/components/navbar/NavbarSkeleton'
import { SiteFooter } from '@/components/SiteFooter'
import { Suspense } from 'react'

export default async function TimKiemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <Suspense fallback={<NavbarSkeleton />}><NavbarServer /></Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
