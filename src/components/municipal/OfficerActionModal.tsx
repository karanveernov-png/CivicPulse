import { useMemo, useState } from 'react'
import type { CivicIssue, IssueStatus } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/primitives'
import { StatusBadge, PriorityBadge, CategoryChip } from '../ui/Badge'
import { nextStatusOptions } from '../../lib/statusWorkflow'
import { STATUS_LABELS, CATEGORY_LABELS, formatDateTime } from '../../lib/format'
import { SEED_TEAMS } from '../../data/seedTeams'
import { findDuplicateCandidates } from '../../lib/duplicateDetection'
import { computePriority } from '../../lib/prioritization'
import { useApp } from '../../state/AppContext'
import { useToast } from '../../state/ToastContext'

export function OfficerActionModal({ issue, allIssues, onClose }: { issue: CivicIssue; allIssues: CivicIssue[]; onClose: () => void }) {
  const { dispatch } = useApp()
  const { showToast } = useToast()
  const actorLabel = 'Ward Officer (Demo)'
  const [reason, setReason] = useState('')
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolutionPhoto, setResolutionPhoto] = useState('')
  const [pendingTransition, setPendingTransition] = useState<IssueStatus | null>(null)

  const priority = computePriority(issue)
  const options = nextStatusOptions(issue.status)
  const candidates = useMemo(
    () => findDuplicateCandidates(issue, allIssues.filter((i) => i.id !== issue.id)),
    [issue, allIssues],
  )

  const applyTransition = (to: IssueStatus) => {
    if (to === 'rejected' || to === 'reopened') { setPendingTransition(to); return }
    if (to === 'resolved') { setPendingTransition(to); return }
    dispatch({ type: 'CHANGE_STATUS', issueId: issue.id, to, actorLabel })
    showToast(`Status updated to ${STATUS_LABELS[to]}.`, 'success')
  }

  const confirmReasonedTransition = () => {
    if (!pendingTransition) return
    if (pendingTransition === 'resolved') {
      dispatch({ type: 'CHANGE_STATUS', issueId: issue.id, to: 'resolved', actorLabel, note: resolutionNote || 'Work completed.' })
      dispatch({ type: 'ATTACH_RESOLUTION', issueId: issue.id, note: resolutionNote || 'Repair completed and verified on site.', photoUrl: resolutionPhoto || undefined, actorLabel })
      showToast('Marked resolved with resolution evidence attached.', 'success')
    } else {
      dispatch({ type: 'CHANGE_STATUS', issueId: issue.id, to: pendingTransition, actorLabel, reason: reason || 'No reason provided.' })
      showToast(`Status updated to ${STATUS_LABELS[pendingTransition]}.`, 'success')
    }
    setPendingTransition(null)
    setReason('')
    setResolutionNote('')
    setResolutionPhoto('')
  }

  const assignTeam = (team: string) => {
    dispatch({ type: 'ASSIGN_TEAM', issueId: issue.id, team, actorLabel })
    showToast(`Assigned to ${team}.`, 'success')
  }

  const mergeInto = (canonicalId: string, distanceMeters: number) => {
    dispatch({ type: 'MERGE_DUPLICATE', canonicalId, duplicateId: issue.id, distanceMeters, actorLabel })
    showToast(`Merged ${issue.id} into ${canonicalId}.`, 'success')
    onClose()
  }

  return (
    <Modal title={`Manage ${issue.id}`} onClose={onClose} width="max-w-xl">
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge level={priority.level} score={priority.score} />
            <CategoryChip label={CATEGORY_LABELS[issue.category]} />
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--color-navy-950)]">{issue.title}</p>
          <p className="text-xs text-[var(--color-slate-500)]">{issue.location.ward} · Reported {formatDateTime(issue.reportedAt)}</p>
        </div>

        {/* Status transitions */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate-500)]">Update status</p>
          {options.length === 0 ? (
            <p className="text-xs text-[var(--color-slate-500)]">No further transitions from this status.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => (
                <Button key={opt} variant="secondary" onClick={() => applyTransition(opt)}>{STATUS_LABELS[opt]}</Button>
              ))}
            </div>
          )}

          {pendingTransition && (
            <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3">
              {pendingTransition === 'resolved' ? (
                <>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-slate-500)]">Resolution note</label>
                  <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} rows={2} className="form-input" placeholder="Describe the repair that was completed." />
                  <label className="mb-1 mt-2 block text-xs font-medium text-[var(--color-slate-500)]">Illustrative photo URL (optional, demo evidence)</label>
                  <input value={resolutionPhoto} onChange={(e) => setResolutionPhoto(e.target.value)} className="form-input" placeholder="https://…" />
                </>
              ) : (
                <>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-slate-500)]">Reason for {STATUS_LABELS[pendingTransition]}</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="form-input" placeholder="Required for the public timeline." />
                </>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPendingTransition(null)}>Cancel</Button>
                <Button variant="primary" onClick={confirmReasonedTransition}>Confirm</Button>
              </div>
            </div>
          )}
        </section>

        {/* Team assignment */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate-500)]">Assign team</p>
          <div className="flex flex-wrap gap-2">
            {SEED_TEAMS.map((t) => (
              <Button key={t.id} variant={issue.assignedTeam === t.name ? 'primary' : 'secondary'} onClick={() => assignTeam(t.name)}>{t.name}</Button>
            ))}
          </div>
        </section>

        {/* Duplicate review */}
        {candidates.length > 0 && issue.status !== 'duplicate' && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate-500)]">Duplicate suggestions</p>
            <div className="space-y-2">
              {candidates.slice(0, 3).map((c) => (
                <div key={c.issue.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] p-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[var(--color-navy-900)]">{c.issue.id} · {c.issue.title}</p>
                    <p className="text-[11px] text-[var(--color-slate-500)]">{c.distanceMeters}m away · {c.confidence} match</p>
                  </div>
                  <Button variant="secondary" className="flex-shrink-0 !px-2 !py-1 text-xs" onClick={() => mergeInto(c.issue.id, c.distanceMeters)}>Merge into this</Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Audit trail */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate-500)]">Audit history</p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {issue.auditTrail.map((a) => (
              <p key={a.id} className="text-xs text-[var(--color-navy-700)]"><span className="font-medium">{a.action}</span> — {a.detail} <span className="text-[var(--color-navy-400)]">({formatDateTime(a.timestamp)}, {a.actorLabel})</span></p>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  )
}
