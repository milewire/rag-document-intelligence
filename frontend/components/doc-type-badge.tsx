import { cn } from '@/lib/utils'
import type { DocumentType } from '@/lib/data'

const config: Record<DocumentType, { label: string; className: string }> = {
  incident_report: {
    label: 'Incident Report',
    className: 'bg-[oklch(0.57_0.22_25/0.12)] text-[oklch(0.75_0.18_25)] border border-[oklch(0.57_0.22_25/0.25)]',
  },
  runbook: {
    label: 'Runbook',
    className: 'bg-[oklch(0.62_0.2_240/0.12)] text-[oklch(0.75_0.15_240)] border border-[oklch(0.62_0.2_240/0.25)]',
  },
  troubleshooting_guide: {
    label: 'Troubleshooting',
    className: 'bg-[oklch(0.75_0.17_85/0.12)] text-[oklch(0.85_0.13_85)] border border-[oklch(0.75_0.17_85/0.25)]',
  },
}

export function DocTypeBadge({ type }: { type: DocumentType }) {
  const { label, className } = config[type]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium',
        className
      )}
    >
      {label}
    </span>
  )
}
