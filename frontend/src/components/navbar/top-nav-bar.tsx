'use client'
import { Button } from '@/components/ui/button'
import ClientLink from '@/components/ui/client-link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DivLogo } from '@/components/div-logo'
import useSession from '@/useSession'
import {
  ArrowRight,
  CircleUser,
  Menu,
  ChevronDown,
  LogIn,
  Settings,
  LogOut,
  User,
  Zap,
  Link2,
  Home,
  Info,
  BookOpen,
  Microscope,
  MessageCircle,
  BriefcaseMedical,
  Phone,
  Users,
  Stethoscope,
  Baby,
  Search,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { MenuItemDto } from '@/client/types.gen'

// ── Search dropdown ────────────────────────────────────────────────────────
function SearchDropdown({ keywords = ['Sản khoa', 'Phụ khoa', 'Sơ sinh', 'IVF'] }: { keywords?: string[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Focus input khi mở
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const submit = () => {
    const q = query.trim()
    if (!q) { inputRef.current?.focus(); return }
    router.push(`/timkiem?q=${encodeURIComponent(q)}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger: search icon */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors
          ${open ? 'bg-[#0f766e]/10 text-[#0f766e]' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
        aria-label="Tìm kiếm"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-3 w-72">
            <form
              onSubmit={(e) => { e.preventDefault(); submit() }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập từ khóa..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             placeholder:text-gray-400 outline-none
                             focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 transition-all"
                />
              </div>
              {/* Arrow button */}
              <button
                type="submit"
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                           bg-[#0f766e] text-white shadow-sm
                           hover:bg-[#0d9488] active:scale-95 transition-all duration-150"
                aria-label="Tìm kiếm"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick links */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => { router.push(`/timkiem?q=${encodeURIComponent(kw)}`); setOpen(false); setQuery('') }}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700
                             text-gray-500 hover:border-[#14b8a6] hover:text-[#0f766e] transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  info: Info,
  'book-open': BookOpen,
  book: BookOpen,
  microscope: Microscope,
  research: Microscope,
  'message-circle': MessageCircle,
  chat: MessageCircle,
  'briefcase-medical': BriefcaseMedical,
  service: BriefcaseMedical,
  phone: Phone,
  contact: Phone,
  users: Users,
  user: User,
  stethoscope: Stethoscope,
  baby: Baby,
}

function getIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Link2
  return ICON_MAP[iconName.toLowerCase().trim()] ?? Link2
}

interface MenuNode {
  item: MenuItemDto
  children: MenuNode[]
}

function buildMenuTree(items: MenuItemDto[]): MenuNode[] {
  const active = items.filter((i) => i.isActive !== false)
  const sorted = [...active].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const roots = sorted.filter((i) => !i.parentId)
  return roots.map((root) => ({
    item: root,
    children: sorted
      .filter((i) => i.parentId === root.id)
      .map((child) => ({ item: child, children: [] })),
  }))
}

interface TopNavBarProps {
  initialMenuItems?: MenuItemDto[]
  searchKeywords?: string[]
}

export default function TopNavBar({ initialMenuItems = [], searchKeywords }: TopNavBarProps) {
  const sessionData = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuTree] = useState<MenuNode[]>(() => buildMenuTree(initialMenuItems))

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`sticky inset-x-0 top-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm'
        : 'bg-background border-b'
    }`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <DivLogo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {menuTree.map((node) => {
              const Icon = getIcon(node.item.icon)
              return node.children.length > 0 ? (
                <DropdownMenu key={node.item.id}>
                  <DropdownMenuTrigger asChild>
                    <button className="group flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-accent outline-none">
                      <Icon className="h-4 w-4" />
                      {node.item.displayName}
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {node.children.map((child) => (
                      <DropdownMenuItem key={child.item.id} asChild>
                        <Link href={child.item.url ?? '#'} className="cursor-pointer">
                          {child.item.displayName}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={node.item.id}
                  href={node.item.url ?? '#'}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-accent"
                >
                  <Icon className="h-4 w-4" />
                  {node.item.displayName}
                </Link>
              )
            }
            )}
          </nav>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <DivLogo />
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto">
                  {menuTree.map((node) => (
                    <div key={node.item.id}>
                      <Link
                        href={node.item.url ?? '#'}
                        className="flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                      >
                        {node.item.displayName}
                      </Link>
                      {node.children.length > 0 && (
                        <div className="ml-4 border-l pl-3 space-y-1">
                          {node.children.map((child) => (
                            <Link
                              key={child.item.id}
                              href={child.item.url ?? '#'}
                              className="flex items-center px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                            >
                              {child.item.displayName}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
                <div className="border-t pt-4">
                  {sessionData.data?.isLoggedIn ? (
                    <div className="space-y-2">
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent rounded-md"
                      >
                        <Zap className="h-4 w-4" />
                        Admin Panel
                      </Link>
                      <ClientLink
                        href="/auth/logout"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </ClientLink>
                    </div>
                  ) : (
                    <ClientLink
                      href="/auth/login"
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:bg-primary/10 rounded-md"
                    >
                      <User className="h-4 w-4" />
                      Login
                    </ClientLink>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop User Actions */}
          <div className="flex items-center gap-2">
            <SearchDropdown keywords={searchKeywords} />
            {sessionData.data?.isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                    <CircleUser className="h-4 w-4" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{sessionData.data.userInfo?.name || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {sessionData.data.userInfo?.email || 'No email available'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/admin" className="cursor-pointer">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/profile" className="cursor-pointer">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/settings" className="cursor-pointer">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <ClientLink
                    href="/auth/logout"
                    variant={'ghost'}
                    size={'sm'}
                    className="cursor-pointer w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </ClientLink>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <ClientLink href="/auth/login" variant="ghost" size="sm">
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </ClientLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
