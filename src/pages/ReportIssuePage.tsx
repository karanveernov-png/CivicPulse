import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Construction, Trash2, Lightbulb, Waves, PipetteIcon, Droplets, Building2, HelpCircle,
  Camera, X, ChevronLeft, ChevronRight, CheckCircle2, ImageOff, MapPin,
} from 'lucide-react'
import { reportIssueSchema, type ReportIssueInput, validatePhotoFile } from '../lib/validation'
import { buildLocation } from '../lib/geo'
import { findDuplicateCandidates } from '../lib/duplicateDetection'
import { CATEGORY_LABELS, SEVERITY_LABELS } from '../lib/format'
import type { IssueCategory, IssueSeverity, CivicIssue } from '../types'
import { useApp } from '../state/AppContext'
import { useToast } from '../state/ToastContext'
import { LocationPickerMap } from '../components/map/LocationPickerMap'
import { Button } from '../components/ui/primitives'
import { teamForCategory } from '../data/seedTeams'
import { LogoLockup } from '../components/layout/Logo'
import { LogOut } from 'lucide-react'

const CATEGORY_ICONS: Record<IssueCategory, typeof Construction> = {
  pothole: Construction, garbage: Trash2, streetlight: Lightbulb, waterlogging: Waves,
  drainage: PipetteIcon, water_supply: Droplets, infrastructure: Building2, other: HelpCircle,
}

const STEPS = ['Issue type', 'Details', 'Location', 'Review']

export default function ReportIssuePage() {
  const { state, dispatch, voterId } = useApp()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [submittedIssue, setSubmittedIssue] = useState<CivicIssue | null>(null)
  const [acceptedDuplicateWarning, setAcceptedDuplicateWarning] = useState(false)
  const authName = (() => {
    try {
      return (JSON.parse(localStorage.getItem('cp_auth') ?? 'null') as { name?: string } | null)?.name ?? ''
    } catch {
      return ''
    }
  })()

  const {
    register, handleSubmit, watch, setValue, trigger, formState: { errors },
  } = useForm<ReportIssueInput>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: { reporterName: authName, category: 'pothole', title: '', description: '', severity: 'medium', lat: NaN, lng: NaN },
    mode: 'onBlur',
  })

  const values = watch()
  const locationValue = useMemo(
    () => (Number.isFinite(values.lat) && Number.isFinite(values.lng) ? { lat: values.lat, lng: values.lng } : null),
    [values.lat, values.lng],
  )

  const activeIssues = useMemo(() => state.issues.filter((i) => !['duplicate', 'rejected'].includes(i.status)), [state.issues])

  const duplicates = useMemo(() => {
    if (!locationValue || !values.description || values.description.length < 20) return []
    return findDuplicateCandidates(
      { id: '__draft__', category: values.category, description: values.description, location: buildLocation(locationValue.lat, locationValue.lng) },
      activeIssues,
    )
  }, [locationValue, values.category, values.description, activeIssues])

  const goNext = async () => {
    if (step === 1) {
      const ok = await trigger(['reporterName', 'title', 'description', 'severity'])
      if (!ok) return
    }
    if (step === 2) {
      const ok = await trigger(['lat', 'lng'])
      if (!ok) { showToast('Please select a location within Delhi to continue.', 'error'); return }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const handlePhotoChange = (file: File | null) => {
    setPhotoError(null)
    if (!file) { setPhotoDataUrl(null); return }
    const err = validatePhotoFile(file)
    if (err) { setPhotoError(err); return }
    const reader = new FileReader()
    reader.onload = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const supportExisting = (issueId: string) => {
    dispatch({ type: 'CAST_VOTE', issueId, voterId, voteType: 'support' })
    showToast('Thanks — your support was added to the existing report.', 'success')
    navigate(`/issues/${issueId}`)
  }

  const onSubmit = (data: ReportIssueInput) => {
    const id = `CP-${Math.floor(1000 + Math.random() * 8999)}`
    const now = new Date().toISOString()
    const location = buildLocation(data.lat, data.lng)
    const team = teamForCategory(data.category)
    const issue: CivicIssue = {
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      severityReported: data.severity,
      status: 'reported',
      location,
      photoUrl: photoDataUrl ?? undefined,
      reportedAt: now,
      updatedAt: now,
      reporterId: state.currentUserId,
      reporterLabel: data.reporterName.trim(),
      timeline: [{ id: `tl-0-${id}`, status: 'reported', timestamp: now, actor: 'citizen', actorLabel: data.reporterName.trim(), note: 'Report submitted.' }],
      comments: [],
      votes: [],
      officerVerified: false,
      auditTrail: [{ id: `aud-0-${id}`, timestamp: now, actorLabel: 'System', action: 'Report created', detail: `Submitted via citizen reporting flow. Suggested team: ${team?.name ?? 'Unassigned'}.` }],
      seeded: false,
    }
    dispatch({ type: 'ADD_ISSUE', issue })
    setSubmittedIssue(issue)
  }

  if (submittedIssue) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 font-display text-xl font-bold text-[var(--color-navy-950)]">Report submitted</h1>
        <p className="mt-2 text-sm text-[var(--color-navy-600)]">
          Your report <span className="font-semibold">{submittedIssue.id}</span> has been added and is now awaiting verification.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/map')}>Explore Nearby Issues</Button>
          <Button variant="primary" onClick={() => navigate(`/issues/${submittedIssue.id}`)}>View My Report</Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-paper)] p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <LogoLockup />
          <button
            type="button"
            onClick={() => { localStorage.removeItem('cp_auth'); navigate('/login') }}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-navy-700)]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i < step ? 'bg-green-600 text-white' : i === step ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-border)] text-[var(--color-navy-500)]'
            }`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`hidden text-xs font-medium sm:block ${i === step ? 'text-[var(--color-navy-950)]' : 'text-[var(--color-slate-500)]'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-[var(--color-border)]" />}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: category */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((cat) => {
              const Icon = CATEGORY_ICONS[cat]
              const active = values.category === cat
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setValue('category', cat)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                    active ? 'border-[var(--color-accent)] bg-[var(--color-accent-100)]' : 'border-[var(--color-border)] bg-white hover:bg-[var(--color-paper)]'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${active ? 'text-[var(--color-accent-600)]' : 'text-[var(--color-navy-600)]'}`} />
                  <span className="text-xs font-medium text-[var(--color-navy-800)]">{CATEGORY_LABELS[cat]}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Step 1: details */}
        {step === 1 && (
          <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-5">
            <Field label="Your name" error={errors.reporterName?.message}>
              <input {...register('reporterName')} placeholder="Enter your name" className="form-input" autoComplete="name" />
            </Field>
            <Field label="Title" error={errors.title?.message}>
              <input {...register('title')} placeholder="e.g. Large pothole outside bus stop" className="form-input" />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <textarea {...register('description')} rows={4} placeholder="Describe what you've seen, when, and why it's a concern." className="form-input" />
            </Field>
            <Field label="Severity" error={errors.severity?.message}>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SEVERITY_LABELS) as IssueSeverity[]).map((sev) => (
                  <button type="button" key={sev} onClick={() => setValue('severity', sev)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${values.severity === sev ? 'border-[var(--color-accent)] bg-[var(--color-accent-100)] text-[var(--color-accent-600)]' : 'border-[var(--color-border-strong)] text-[var(--color-navy-600)]'}`}>
                    {SEVERITY_LABELS[sev]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Photo (optional)">
              {photoDataUrl ? (
                <div className="relative w-40">
                  <img src={photoDataUrl} alt="Selected issue photo preview" className="h-28 w-40 rounded-lg object-cover" />
                  <button type="button" onClick={() => handlePhotoChange(null)} className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow border border-[var(--color-border)]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex w-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border-strong)] py-6 text-xs text-[var(--color-slate-500)] hover:bg-[var(--color-paper)]">
                  <Camera className="h-5 w-5" /> Upload photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)} />
                </label>
              )}
              {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
            </Field>
          </div>
        )}

        {/* Step 2: location */}
        {step === 2 && (
          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-white p-5">
            <LocationPickerMap value={locationValue} onChange={(loc) => { setValue('lat', loc.lat); setValue('lng', loc.lng) }} />
            {locationValue ? (
              <div className="rounded-lg bg-[var(--color-paper)] p-3 text-xs text-[var(--color-navy-700)]">
                <p className="flex items-center gap-1 font-medium"><MapPin className="h-3.5 w-3.5" /> {locationValue.lat.toFixed(5)}, {locationValue.lng.toFixed(5)}</p>
                <p className="mt-0.5">{buildLocation(locationValue.lat, locationValue.lng).approximateAddress}</p>
              </div>
            ) : (
              <p className="text-xs text-[var(--color-slate-500)]">Tap the map or use your current location to set where this issue is.</p>
            )}
            {errors.lat && <p className="text-xs text-red-600">{errors.lat.message}</p>}
          </div>
        )}

        {/* Step 3: review */}
        {step === 3 && (
          <div className="space-y-4">
            {duplicates.length > 0 && !acceptedDuplicateWarning && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">This looks similar to {duplicates.length} existing report{duplicates.length > 1 ? 's' : ''} nearby</p>
                <p className="mt-1 text-xs text-amber-800">Supporting an existing report helps avoid duplicate work orders. This is a suggestion, not a definitive match — you can still submit as new.</p>
                <div className="mt-3 space-y-2">
                  {duplicates.slice(0, 2).map((d) => (
                    <div key={d.issue.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white p-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--color-navy-900)]">{d.issue.title}</p>
                        <p className="text-[11px] text-[var(--color-slate-500)]">{d.distanceMeters}m away · {d.confidence} match · {d.issue.votes.filter(v=>v.type==='support').length} supporters</p>
                      </div>
                      <Button type="button" variant="secondary" className="flex-shrink-0 !px-2 !py-1 text-xs" onClick={() => supportExisting(d.issue.id)}>Support this</Button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setAcceptedDuplicateWarning(true)} className="mt-3 text-xs font-medium text-amber-900 underline">
                  None of these match — submit as a new issue
                </button>
              </div>
            )}

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-[var(--color-navy-900)]">Review your report</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <ReviewRow label="Category" value={CATEGORY_LABELS[values.category]} />
                <ReviewRow label="Severity" value={SEVERITY_LABELS[values.severity]} />
                <ReviewRow label="Title" value={values.title} full />
                <ReviewRow label="Description" value={values.description} full />
                <ReviewRow label="Location" value={locationValue ? buildLocation(locationValue.lat, locationValue.lng).approximateAddress ?? '' : '—'} full />
              </dl>
              {photoDataUrl ? (
                <img src={photoDataUrl} alt="" className="mt-3 h-28 w-40 rounded-lg object-cover" />
              ) : (
                <div className="mt-3 flex h-20 w-32 items-center justify-center rounded-lg bg-[var(--color-paper)] text-[var(--color-navy-400)]"><ImageOff className="h-5 w-5" /></div>
              )}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-5 flex justify-between">
          <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" onClick={goNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" variant="primary" disabled={duplicates.length > 0 && !acceptedDuplicateWarning}>
              Submit report
            </Button>
          )}
        </div>
      </form>
        </div>
      </div>
    </main>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--color-slate-500)]">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function ReviewRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-xs text-[var(--color-slate-500)]">{label}</dt>
      <dd className="font-medium text-[var(--color-navy-900)]">{value || '—'}</dd>
    </div>
  )
}
