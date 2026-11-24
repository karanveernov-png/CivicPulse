import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './state/AppContext'
import { ToastProvider } from './state/ToastContext'
import { AppShell } from './components/layout/AppShell'

// Route-level code splitting: the map (MapLibre) and analytics (Recharts) pages
// are the heaviest dependencies, so they're only fetched when actually visited.
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const LiveMapPage = lazy(() => import('./pages/LiveMapPage'))
const ReportIssuePage = lazy(() => import('./pages/ReportIssuePage'))
const MyReportsPage = lazy(() => import('./pages/MyReportsPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const MunicipalConsolePage = lazy(() => import('./pages/MunicipalConsolePage'))
const IssueDetailsPage = lazy(() => import('./pages/IssueDetailsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

function CitizenReportRoute() {
  let auth: { type: 'citizen' | 'admin'; name: string } | null = null
  try {
    auth = JSON.parse(localStorage.getItem('cp_auth') ?? 'null')
  } catch {
    auth = null
  }

  if (!auth) return <Navigate to="/login" replace />
  if (auth.type !== 'citizen') return <Navigate to="/report" replace />
  return <ReportIssuePage />
}

function RouteFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/citizen/report" element={<CitizenReportRoute />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/map" element={<LiveMapPage />} />
                <Route path="/report" element={<ReportIssuePage />} />
                <Route path="/my-reports" element={<MyReportsPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/console" element={<MunicipalConsolePage />} />
                <Route path="/issues/:id" element={<IssueDetailsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </ToastProvider>
  )
}
