import { useMemo, useState } from 'react'
import { NavLink, useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, PlusCircle, FileText, Users, ShieldCheck,
  Menu, X, Bell, Search, ChevronDown, RotateCcw, Info,
} from 'lucide-react'
import { LogoLockup, LogoMark } from './Logo'
import { useApp } from '../../state/AppContext'
import { useToast } from '../../state/ToastContext'
import { STATUS_LABELS } from '../../lib/format'
import { timeAgo } from '../../lib/format'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/primitives'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/map', label: 'Live Map', icon: Map },
  { to: '/report', label: 'Report an Issue', icon: PlusCircle },
  { to: '/my-reports', label: 'My Reports', icon: FileText },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/console', label: 'Municipal Console', icon: ShieldCheck },
]

const SECTION_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/map': 'Live Map',
  '/report': 'Report an Issue',
  '/my-reports': 'My Reports',
  '/community': 'Community',
  '/console': 'Municipal Console',
}

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const { state, dispatch, resetDemoData } = useApp()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const auth = (() => {
    try {
      return JSON.parse(localStorage.getItem('cp_auth') ?? 'null') as { type: 'citizen' | 'admin'; name: string } | null
    } catch {
      return null
    }
  })()

  if (!auth) return <Navigate to="/login" replace />
  if (auth.type === 'citizen') {
    return <Navigate to="/citizen/report" replace />
  }
  const visibleNavItems = NAV_ITEMS

  const notifications = useMemo(() => {
    const events = state.issues.flatMap((issue) =>
      issue.timeline.slice(-1).map((e) => ({ issueId: issue.id, title: issue.title, status: e.status, timestamp: e.timestamp })),
    )
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6)
  }, [state.issues])

  const sectionTitle = SECTION_TITLES[location.pathname] ?? (location.pathname.startsWith('/issues/') ? 'Issue Details' : 'CivicPulse')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return
    navigate(`/community?q=${encodeURIComponent(searchValue.trim())}`)
    setSearchValue('')
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-paper)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-[var(--color-border)] bg-white md:flex">
        <div className="flex h-16 items-center border-b border-[var(--color-border)] px-5">
          <LogoLockup />
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)]' : 'text-[var(--color-navy-600)] hover:bg-[var(--color-paper)]'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3">
          <div className="rounded-lg bg-[var(--color-paper)] px-3 py-2.5 text-xs text-[var(--color-navy-600)]">
            <p className="font-semibold text-[var(--color-navy-900)]">Interactive demo</p>
            <p className="mt-0.5">Simulated reports and municipal workflows — no real data is submitted.</p>
          </div>
        </div>
      </aside>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[140] flex md:hidden">
          <div className="absolute inset-0 bg-[var(--color-navy-950)]/40" onClick={() => setMobileNavOpen(false)} />
          <div className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
              <LogoLockup />
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)]' : 'text-[var(--color-navy-600)]'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 md:px-6">
          <button className="text-[var(--color-navy-700)] md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 md:hidden"><LogoMark className="h-6 w-6" /></div>
          <h1 className="hidden font-display text-base font-semibold text-[var(--color-navy-950)] md:block">{sectionTitle}</h1>

          <form onSubmit={handleSearch} className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-navy-400)]" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search issues, IDs, neighborhoods…"
              className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-paper)] py-1.5 pl-8 pr-3 text-sm"
              aria-label="Search issues"
            />
          </form>

          <button
            onClick={() => navigate('/report')}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-accent-600)] md:ml-0"
          >
            <PlusCircle className="h-4 w-4" /> <span className="hidden sm:inline">Report Issue</span>
          </button>

          <div className="relative">
            <button onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false) }} aria-label="Notifications" className="relative rounded-lg p-2 text-[var(--color-navy-600)] hover:bg-[var(--color-paper)]">
              <Bell className="h-4.5 w-4.5" />
              {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[var(--color-border)] bg-white p-2 shadow-lg">
                <p className="px-2 py-1 text-xs font-semibold text-[var(--color-slate-500)]">Recent activity</p>
                {notifications.length === 0 && <p className="px-2 py-3 text-sm text-[var(--color-slate-500)]">No activity yet.</p>}
                {notifications.map((n) => (
                  <button
                    key={`${n.issueId}-${n.timestamp}`}
                    onClick={() => { setNotifOpen(false); navigate(`/issues/${n.issueId}`) }}
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--color-paper)]"
                  >
                    <span className="font-medium text-[var(--color-navy-900)]">{STATUS_LABELS[n.status as keyof typeof STATUS_LABELS]}</span>
                    <span className="text-[var(--color-slate-500)]"> · {n.title}</span>
                    <p className="text-xs text-[var(--color-navy-400)]">{timeAgo(n.timestamp)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false) }} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] px-2 py-1.5 text-sm hover:bg-[var(--color-paper)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-100)] text-xs font-semibold text-[var(--color-accent-600)]">
                {state.currentRole === 'citizen' ? (auth.name?.trim().charAt(0).toUpperCase() || 'C') : 'A'}
              </span>
              <span className="hidden text-xs font-medium text-[var(--color-navy-700)] sm:inline">
                {state.currentRole === 'citizen' ? auth.name : auth.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--color-navy-400)]" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-[var(--color-border)] bg-white p-2 shadow-lg">
                <p className="px-2 py-1 text-xs font-semibold text-[var(--color-slate-500)]">Account</p>
                {state.currentRole === 'officer' && (
                  <button
                    onClick={() => { dispatch({ type: 'SWITCH_ROLE', role: 'citizen' }); setProfileOpen(false); navigate('/') }}
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--color-paper)]"
                  >
                    Open Citizen Portal
                  </button>
                )}
                <button
                  onClick={() => { localStorage.removeItem('cp_auth'); setProfileOpen(false); navigate('/login') }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  Sign out
                </button>
                <div className="my-1.5 border-t border-[var(--color-border)]" />
                <button onClick={() => { setProfileOpen(false); setConfirmReset(true) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--color-navy-700)] hover:bg-[var(--color-paper)]">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
                </button>
                <button onClick={() => { setProfileOpen(false); setAboutOpen(true) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--color-navy-700)] hover:bg-[var(--color-paper)]">
                  <Info className="h-3.5 w-3.5" /> About this demo
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {confirmReset && (
        <Modal title="Reset demo data?" onClose={() => setConfirmReset(false)} width="max-w-sm">
          <p className="text-sm text-[var(--color-navy-700)]">
            This clears every report you've submitted or voted on during this session and restores the original seeded dataset. This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { resetDemoData(); setConfirmReset(false); showToast('Demo data has been reset.', 'success') }}>Reset data</Button>
          </div>
        </Modal>
      )}

      {aboutOpen && (
        <Modal title="About this demo" onClose={() => setAboutOpen(false)}>
          <div className="space-y-3 text-sm text-[var(--color-navy-700)]">
            <p>CivicPulse is an interactive frontend demonstration built for a hackathon. The interactive map uses real OpenStreetMap-based basemap tiles, but every civic report, vote, and municipal action is seeded or simulated locally in your browser.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>No real municipality, officer, or citizen account is connected.</li>
              <li>Data persists only in this browser via localStorage — it is not shared between users or devices.</li>
              <li>Role-based access (Citizen vs. Municipal Console) is a frontend convenience, not real authorization — a production system would enforce this server-side.</li>
              <li>Multi-user sync, authentication, and official integrations would require a backend.</li>
            </ul>
          </div>
        </Modal>
      )}
    </div>
  )
}
