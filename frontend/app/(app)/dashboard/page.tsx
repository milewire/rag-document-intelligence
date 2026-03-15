'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Search,
  Upload,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDocuments, getHealth } from '@/lib/api'
import type { DocumentItem } from '@/lib/api'

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState<string | null>(null)

  const [healthStatus, setHealthStatus] = useState<'up' | 'down' | 'checking' | null>(null)

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true)
    setDocumentsError(null)
    try {
      const res = await getDocuments()
      setDocuments(res.documents ?? [])
    } catch {
      setDocumentsError('Backend unavailable')
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    let cancelled = false
    setHealthStatus('checking')
    getHealth()
      .then((data) => {
        if (!cancelled) setHealthStatus(data?.status === 'running' ? 'up' : 'down')
      })
      .catch(() => {
        if (!cancelled) setHealthStatus('down')
      })
    return () => { cancelled = true }
  }, [])

  const totalChunks = documents.reduce((sum, d) => sum + d.chunk_count, 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-semibold text-foreground">{documents.length}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">in knowledge base</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total chunks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-semibold text-foreground">{totalChunks}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">indexed for search</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Backend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthStatus === 'checking' ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : healthStatus === 'up' ? (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Running</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Unavailable</span>
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">RAG API status</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
            <CardDescription>Search or add documents</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/search" className="inline-flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search knowledge base
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/documents" className="inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload documents
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Knowledge base</CardTitle>
          <CardDescription>
            Documents currently indexed. Upload or manage in Documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : documentsError ? (
            <p className="text-sm text-muted-foreground py-4">{documentsError}</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No documents yet.{' '}
              <Link href="/documents" className="text-primary hover:underline">
                Upload your first document
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.filename}
                  className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {doc.filename}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {doc.chunk_count} chunks
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
