'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  BookOpen,
  FileText,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/runbooks', label: 'Runbooks', icon: BookOpen },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo / Home */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0 hover:bg-sidebar-accent/50 transition-colors"
        title="Dashboard"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded bg-primary">
          <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">OpsIQ</span>
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/20">
          Beta
        </Badge>
      </Link>

      {/* Workspace selector */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded hover:bg-sidebar-accent text-left transition-colors group">
          <div className="w-5 h-5 rounded bg-chart-2/20 flex items-center justify-center text-[10px] font-bold text-chart-2">
            A
          </div>
          <span className="text-xs font-medium text-sidebar-foreground flex-1 truncate">Acme Corp</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-2 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2.5 mb-2 mt-2">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <Icon
                    className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : '')}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom workspace info */}
      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">Alex Kim</p>
            <p className="text-[10px] text-muted-foreground truncate">alex@acme.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
