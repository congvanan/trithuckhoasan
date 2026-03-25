'use client'
import dynamic from 'next/dynamic'
import type { MenuItemDto } from '@/client/types.gen'

const TopNavBar = dynamic(() => import('./top-nav-bar'), { ssr: false })

export function NavbarWrapper({ initialMenuItems }: { initialMenuItems: MenuItemDto[] }) {
  return <TopNavBar initialMenuItems={initialMenuItems} />
}
