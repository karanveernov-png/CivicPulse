import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, ShieldCheck, ThumbsUp, ThumbsDown, ArrowLeft, Link2, ImageOff, MessageSquare,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { useToast } from '../state/ToastContext'
import { StatusBadge, PriorityBadge, CategoryChip } from '../components/ui/Badge'
import { Card, EmptyState, Button } from '../components/ui/primitives'
import { StatusTimelineView } from '../components/issues/StatusTimeline'
import { CATEGORY_LABELS, formatDate, formatDateTime, timeAgo } from '../lib/format'
import { computePriority } from '../lib/prioritization'
import { MapView } from '../components/map/MapView'

export default function IssueDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch, voterId } = useApp()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [commentText, setCommentText] = useState('')

  const issue = state.issues.find((i) => i.id === id)
  const canonical = issue?.duplicateOf ? state.issues.find((i) => i.id === issue.duplicateOf) : undefined
  const mergedIssues = useMemo(
    () => (issue?.canonicalFor ?? []).map((mid) => state.issues.find((i) => i.id === mid)).filter(Boolean) as typeof state.issues,
    [issue, state.issues],
  )

  if (!issue) {
    return (
      <EmptyState
        title="Report not found"
        description="This report may have been removed, or the link is incorrect."
        action={<Button variant="primary" onClick={() => navigate('/community')}>Back to Community</Button>}
      />
    )
  }

  const priority = computePriority(issue)
  const myVote = issue.votes.find((v) => v.voterId === voterId)
  const confirmCount = new Set(issue.votes.filter((v) => v.type === 'confirm').map((v) => v.voterId)).size
  const supportCount = new Set(issue.votes.filter((v) => v.type === 'support').map((v) => v.voterId)).size
  const notPresentCount = new Set(issue.votes.filter((v) => v.type === 'not_present').map((v) => v.voterId)).size

  const castVote = (type: 'confirm' | 'support' | 'not_present') => {
    if (myVote?.type === type) {
      dispatch({ type: 'WITHDRAW_VOTE', issueId: issue.id, voterId })
      showToast('Your vote was withdrawn.')
      return
    }
    dispatch({ type: 'CAST_VOTE', issueId: issue.id, voterId, voteType: type })
    showToast('Thanks for your input — this helps prioritize the report.', 'success')
  }

  const submitComment = () => {
    if (!commentText.trim()) return
    dispatch({ type: 'ADD_COMMENT', issueId: issue.id, text: commentText.trim(), authorLabel: 'You (Demo Citizen)', authorRole: 'citizen' })
    setCommentText('')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-[var(--color-navy-600)] hover:text-[var(--color-navy-900)]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {issue.status === 'duplicate' && canonical && (
        <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-900">
          <Link2 className="h-4 w-4 flex-shrink-0" />
          This report was merged as a duplicate of <Link to={`/issues/${canonical.id}`} className="font-semibold underline">{canonical.id}</Link>.
        </div>
      )}
      {mergedIssues.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-900">
          <Link2 className="h-4 w-4 flex-shrink-0" />
          This is the canonical issue for {mergedIssues.length} merged duplicate report{mergedIssues.length > 1 ? 's' : ''}:
          {mergedIssues.map((m) => <Link key={m!.id} to={`/issues/${m!.id}`} className="font-semibold underline">{m!.id}</Link>)}
        </div>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={issue.status} />
          <PriorityBadge level={priority.level} score={priority.score} />
          <CategoryChip label={CATEGORY_LABELS[issue.category]} />
          <span className="ml-auto text-xs text-[var(--color-navy-400)]">{issue.id}</span>
        </div>
        <h1 className="mt-2 font-display text-xl font-bold text-[var(--color-navy-950)]">{issue.title}</h1>
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-slate-500)]">
          <MapPin className="h-3.5 w-3.5" /> {issue.location.approximateAddress} · Reported {formatDate(issue.reportedAt)} by {issue.reporterLabel}
        </p>
        <p className="mt-3 text-sm text-[var(--color-navy-700)]">{issue.description}</p>

        {issue.photoUrl ? (
          <img src={issue.photoUrl} alt="Reported issue" className="mt-4 h-56 w-full rounded-xl object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />
        ) : (
          <div className="mt-4 flex h-40 items-center justify-center rounded-xl bg-[var(--color-paper)] text-[var(--color-navy-400)]">
            <ImageOff className="h-6 w-6" />
          </div>
        )}

        <div className="mt-4 rounded-lg bg-[var(--color-paper)] p-3 text-xs text-[var(--color-navy-700)]">
          <p className="font-semibold text-[var(--color-navy-900)]">Why this priority score: {priority.score}/100</p>
          <p className="mt-0.5">{priority.explanation}</p>
          <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
            {priority.factors.map((f) => <li key={f.label}>{f.label}: +{f.contribution}</li>)}
          </ul>
        </div>
      </Card>

      {/* Community actions */}
      <Card className="p-5">
        <p className="mb-1 text-sm font-semibold text-[var(--color-navy-900)]">Community verification</p>
        <p className="mb-3 text-xs text-[var(--color-slate-500)]">
          Confirmations and support help officers prioritize — they never automatically mark an issue resolved. This is simulated community participation for this demo.
        </p>
        <div className="flex flex-wrap gap-2">
          <VoteButton icon={ShieldCheck} label={`Confirm (${confirmCount})`} active={myVote?.type === 'confirm'} onClick={() => castVote('confirm')} />
          <VoteButton icon={ThumbsUp} label={`Support (${supportCount})`} active={myVote?.type === 'support'} onClick={() => castVote('support')} />
          <VoteButton icon={ThumbsDown} label={`No longer there (${notPresentCount})`} active={myVote?.type === 'not_present'} onClick={() => castVote('not_present')} />
        </div>

        <div className="mt-4 space-y-2">
          {issue.comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-[var(--color-border)] p-2.5 text-sm">
              <p className="text-xs font-medium text-[var(--color-navy-900)]">{c.authorLabel} · <span className="text-[var(--color-slate-500)]">{timeAgo(c.timestamp)}</span></p>
              <p className="mt-0.5 text-[var(--color-navy-700)]">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add an optional comment…" className="form-input" onKeyDown={(e) => e.key === 'Enter' && submitComment()} />
          <Button variant="secondary" onClick={submitComment}><MessageSquare className="h-4 w-4" /></Button>
        </div>
      </Card>

      {issue.resolution && (
        <Card className="p-5">
          <p className="mb-1 text-sm font-semibold text-green-800">Resolution evidence (illustrative demo photo)</p>
          <p className="text-sm text-[var(--color-navy-700)]">{issue.resolution.note}</p>
          {issue.resolution.photoUrl && <img src={issue.resolution.photoUrl} alt="Illustrative resolution evidence" className="mt-2 h-44 w-full rounded-xl object-cover" />}
          <p className="mt-1 text-xs text-[var(--color-slate-500)]">Recorded by {issue.resolution.recordedBy} on {formatDateTime(issue.resolution.recordedAt)}.</p>
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--color-navy-900)]">Public status timeline</p>
        <StatusTimelineView events={issue.timeline} />
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--color-navy-900)]">Location</p>
        <MapView issues={[issue]} heightClassName="h-[280px]" interactive={false} selectedIssueId={issue.id} />
      </Card>
    </div>
  )
}

function VoteButton({ icon: Icon, label, active, onClick }: { icon: typeof ShieldCheck; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'border-[var(--color-accent)] bg-[var(--color-accent-100)] text-[var(--color-accent-600)]' : 'border-[var(--color-border-strong)] text-[var(--color-navy-700)] hover:bg-[var(--color-paper)]'
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}
