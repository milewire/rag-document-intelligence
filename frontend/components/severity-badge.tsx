import { cn } from '@/lib/utils'
import type { Severity } from '@/lib/data'

const config: Record<Severity, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-[oklch(0.57_0.22_25/0.15)] text-[oklch(0.75_0.18_25)] border border-[oklch(0.57_0.22_25/0.3)]',
  },
  high: {
    label: 'High',
    className: 'bg-[oklch(0.65_0.19_50/0.15)] text-[oklch(0.78_0.15_50)] border border-[oklch(0.65_0.19_50/0.3)]',
  },
  medium: {
    label: 'Medium',
    className: 'bg-[oklch(0.75_0.17_85/0.15)] text-[oklch(0.85_0.13_85)] border border-[oklch(0.75_0.17_85/0.3)]',
  },
  low: {
    label: 'Low',
    className: 'bg-[oklch(0.62_0.2_240/0.15)] text-[oklch(0.75_0.15_240)] border border-[oklch(0.62_0.2_240/0.3)]',
  },
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className } = config[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide',
        className
      )}
    >
      {label}
    </span>
  )
}
