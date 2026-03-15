export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'open' | 'investigating' | 'resolved'
export type DocumentType = 'incident_report' | 'runbook' | 'troubleshooting_guide'

export interface Incident {
  id: string
  service: string
  severity: Severity
  status: IncidentStatus
  date: string
  summary: string
  rootCause: string
  resolution?: string
  duration: string
  assignee: string
}

export interface Document {
  id: string
  title: string
  type: DocumentType
  service: string
  updatedAt: string
  size: string
  author: string
}

export interface RunbookStep {
  step: number
  title: string
  description: string
  command?: string
}

export interface Runbook {
  id: string
  title: string
  service: string
  description: string
  updatedAt: string
  steps: RunbookStep[]
  tags: string[]
}

export interface ActivityEvent {
  id: string
  type: 'incident_opened' | 'incident_resolved' | 'doc_uploaded' | 'runbook_updated'
  message: string
  timestamp: string
  service: string
  severity?: Severity
}
