'use client'
import dynamic from 'next/dynamic'
import type { MenuItemDto } from '@/client/types.gen'

const TopNavBar = dynamic(() => import('./top-nav-bar'), { ssr: false })

interface NavbarWrapperProps {
  initialMenuItems: MenuItemDto[]
  searchKeywords?: string[]
}

export function NavbarWrapper({ initialMenuItems, searchKeywords }: NavbarWrapperProps) {
  return <TopNavBar initialMenuItems={initialMenuItems} searchKeywords={searchKeywords} />
}
