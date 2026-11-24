import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Camera, MapPin, ShieldCheck, UserRound } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { LogoLockup } from '../components/layout/Logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const [portal, setPortal] = useState<'citizen' | 'admin'>('citizen')
  const [name, setName] = useState('')
  const [station, setStation] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const enterCitizen = (event: React.FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Enter your name to continue.')
      return
    }
    localStorage.setItem('cp_auth', JSON.stringify({ type: 'citizen', name: name.trim() }))
    dispatch({ type: 'SWITCH_ROLE', role: 'citizen' })
    navigate('/citizen/report')
  }

  const enterAdmin = (event: React.FormEvent) => {
    event.preventDefault()
    if (!station.trim() || !password.trim()) {
      setError('Enter the admin station name and password.')
      return
    }
    if (station.trim().toLowerCase() !== 'admin station') {
      setError('Station name must be Admin Station.')
      return
    }
    if (password !== 'admin1234') {
      setError('Incorrect password.')
      return
    }
    localStorage.setItem('cp_auth', JSON.stringify({ type: 'admin', name: station.trim() }))
    dispatch({ type: 'SWITCH_ROLE', role: 'officer' })
    navigate('/console')
  }

  return (
    <main className="min-h-screen bg-[var(--color-paper)] p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <LogoLockup />
        <div className="mt-8 grid overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm md:grid-cols-[0.85fr_1.15fr]">
          <section className="hidden bg-[var(--color-navy-950)] p-8 text-white md:block">
            <p className="text-sm font-medium text-orange-300">CivicPulse Delhi</p>
            <h1 className="mt-3 max-w-sm font-display text-3xl font-bold">A clearer way to improve your neighbourhood.</h1>
            <div className="mt-8 space-y-4 text-sm text-white/80">
              <Feature icon={MapPin} text="Pin the exact location" />
              <Feature icon={Camera} text="Upload a photo of the issue" />
              <Feature icon={ShieldCheck} text="Track it through resolution" />
            </div>
          </section>

          <section className="p-5 sm:p-8">
            <div className="grid grid-cols-2 rounded-xl bg-[var(--color-paper)] p-1">
              <button type="button" onClick={() => { setPortal('citizen'); setError('') }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${portal === 'citizen' ? 'bg-white text-[var(--color-accent-600)] shadow-sm' : 'text-[var(--color-navy-600)]'}`}>
                <UserRound className="h-4 w-4" /> Citizen
              </button>
              <button type="button" onClick={() => { setPortal('admin'); setError('') }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${portal === 'admin' ? 'bg-white text-[var(--color-accent-600)] shadow-sm' : 'text-[var(--color-navy-600)]'}`}>
                <Building2 className="h-4 w-4" /> Admin station
              </button>
            </div>

            {portal === 'citizen' ? (
              <form onSubmit={enterCitizen} className="mt-6 space-y-4">
                <div>
                  <p className="font-display text-xl font-bold text-[var(--color-navy-950)]">Report as a citizen</p>
                  <p className="mt-1 text-sm text-[var(--color-slate-500)]">No account required for this demo.</p>
                </div>
                <Field label="Your name">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="form-input" autoComplete="name" />
                </Field>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-600)]">
                  Continue to Citizen Portal
                </button>
              </form>
            ) : (
              <form onSubmit={enterAdmin} className="mt-6 space-y-4">
                <div>
                  <p className="font-display text-xl font-bold text-[var(--color-navy-950)]">Municipal operations login</p>
                  <p className="mt-1 text-sm text-[var(--color-slate-500)]">For ward officers and admin stations.</p>
                </div>
                <Field label="Admin station name">
                  <input value={station} onChange={(e) => setStation(e.target.value)} placeholder="Admin Station" className="form-input" />
                </Field>
                <Field label="Password">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin1234" className="form-input" />
                </Field>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="w-full rounded-lg bg-[var(--color-navy-950)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-navy-800)]">
                  Sign in to Admin Station
                </button>
                <p className="rounded-lg bg-[var(--color-paper)] px-3 py-2 text-xs text-[var(--color-navy-600)]">
                  For demo, use <span className="font-semibold text-[var(--color-navy-900)]">Admin Station</span> as the station name and <span className="font-semibold text-[var(--color-navy-900)]">admin1234</span> as the password.
                </p>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--color-slate-500)]">{label}</span>
      {children}
    </label>
  )
}

function Feature({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><Icon className="h-4 w-4" /></span>
      {text}
    </div>
  )
}
