'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getDocuments } from '@/lib/api'
import type { DocumentItem } from '@/lib/api'
import { Search, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from './runbooks-client.module.css'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

function UploadedDocCard({ doc, onSelect }: { doc: DocumentItem; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left bg-card border border-border rounded-lg overflow-hidden hover:bg-muted/50 hover:border-ring/40 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="w-full flex items-start gap-3 px-5 py-4">
        <div className={cn(styles.serviceIconBg, styles.serviceIconBg_default)}>
          <FileText className={cn('w-4 h-4', styles.serviceIconFg_default)} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug truncate">{doc.filename}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[11px] text-muted-foreground">{doc.chunk_count} chunks</span>
          </div>
        </div>
      </div>
    </button>
  )
}

export function RunbooksClient() {
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)

  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  const loadDocs = useCallback(async () => {
    setDocsLoading(true)
    try {
      const res = await getDocuments()
      setUploadedDocs(res.documents ?? [])
    } catch {
      setUploadedDocs([])
    } finally {
      setDocsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  const filteredDocs = uploadedDocs.filter(d =>
    !search || d.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Runbooks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your uploaded runbooks and guides. Upload documents on the Documents page to see them here.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search runbooks..."
            className="w-full bg-card border border-border rounded pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {docsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
          {uploadedDocs.length === 0
            ? <>No runbooks yet. <Link href="/documents" className="text-primary hover:underline">Upload documents</Link> to get started.</>
            : 'No runbooks match your search.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map(doc => (
            <UploadedDocCard
              key={doc.filename}
              doc={doc}
              onSelect={() => setSelectedDoc(doc)}
            />
          ))}
        </div>
      )}

      <Sheet open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          {selectedDoc && (
            <>
              <SheetHeader>
                <SheetTitle className="truncate pr-8">{selectedDoc.filename}</SheetTitle>
                <SheetDescription>
                  {selectedDoc.chunk_count} chunks indexed. Use Search to ask questions about this document.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <Button asChild>
                  <Link href="/search">Search this runbook</Link>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
