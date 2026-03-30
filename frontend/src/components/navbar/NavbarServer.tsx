import { fetchMenuItems } from '@/lib/server/fetchMenu'
import { readSearchKeywords } from '@/lib/server/pageLayout'
import { NavbarWrapper } from './NavbarWrapper'

export async function NavbarServer() {
  let menuItems: Awaited<ReturnType<typeof fetchMenuItems>> = []
  let keywords: string[] = []
  try {
    ;[menuItems, keywords] = await Promise.all([
      fetchMenuItems(),
      Promise.resolve(readSearchKeywords()),
    ])
  } catch (err) {
    console.error('[NavbarServer] failed to load:', err)
  }
  return <NavbarWrapper initialMenuItems={menuItems} searchKeywords={keywords} />
}
