export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#10213C" />
      <path d="M16 6c-5 0-8.5 3.6-8.5 8.2 0 5.7 6.9 11 8.1 11.8.2.2.6.2.8 0 1.2-.8 8.1-6.1 8.1-11.8C24.5 9.6 21 6 16 6z" fill="#EF7A3C" />
      <circle cx="16" cy="14" r="3.1" fill="#F7F8FA" />
    </svg>
  )
}

export function LogoLockup({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-display text-[17px] font-bold tracking-tight text-[var(--color-navy-950)]">
        Civic<span className="text-[var(--color-accent)]">Pulse</span>
      </span>
    </div>
  )
}
