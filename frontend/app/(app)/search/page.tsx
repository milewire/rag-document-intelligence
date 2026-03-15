'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, FileText, Loader2 } from 'lucide-react'
import { search as searchApi, getDocuments, getFriendlyErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { DocumentItem } from '@/lib/api'

type QueryResponse = {
  query: string
  response: string
  sources: { file_name: string; score: number }[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState<string | null>(null)

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true)
    setDocumentsError(null)
    try {
      const res = await getDocuments()
      setDocuments(res.documents ?? [])
    } catch (e) {
      setDocumentsError(getFriendlyErrorMessage(e))
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const searchText = query.trim()
    if (!searchText) return
    setError(null)
    setResults(null)
    setLoading(true)
    try {
      const data = await searchApi(searchText, 5)
      setResults({
        query: typeof data?.query === 'string' ? data.query : searchText,
        response: typeof data?.response === 'string' ? data.response : '',
        sources: Array.isArray(data?.sources) ? data.sources : [],
      })
    } catch (e) {
      setError(getFriendlyErrorMessage(e) || 'Search failed. Backend unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground text-center mb-2">
            Search knowledge base
          </h1>

          <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                What’s in the knowledge base
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={loadDocuments}
                disabled={documentsLoading}
              >
                {documentsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
            {documentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            ) : documentsError ? (
              <p className="text-sm text-muted-foreground">Could not load documents. Backend may be offline.</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents yet. <Link href="/documents" className="text-primary hover:underline">Upload documents</Link> first to search them.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {documents.map((doc) => (
                  <li key={doc.filename} className="flex items-center gap-2 text-sm text-foreground">
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{doc.filename}</span>
                    <span className="text-muted-foreground shrink-0">({doc.chunk_count} chunks)</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe an issue, error message, or system behavior..."
                className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                aria-label="Search"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Ask a question in natural language. Answers use your uploaded documents (see Documents).
            </p>
            <div className="flex justify-center">
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-1">
              Ask about the documents listed above.
            </p>
          </form>

          {error && (
            <p className="mt-4 text-sm text-destructive text-center" role="alert">
              {error}
            </p>
          )}

          {loading && (
            <div className="mt-6 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && results && (
            <div className="mt-8 space-y-4 text-left max-w-2xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Results
              </p>
              {results.response && (
                <div className="p-4 rounded-lg bg-card border border-border mb-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{results.response}</p>
                </div>
              )}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Sources</p>
                {results.sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sources</p>
                ) : (
                  results.sources.map((s, i) => (
                    <div
                      key={`${s.file_name}-${i}`}
                      className="p-4 rounded-lg bg-card border border-border"
                    >
                      <p className="text-sm font-medium text-foreground">{s.file_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">score: {s.score}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
