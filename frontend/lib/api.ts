const BASE_URL = 'http://localhost:8000'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Return a user-friendly message for failed API calls. */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'The service is not available.'
    if (error.status >= 500) return 'The server is having trouble. Please try again later.'
    if (error.status === 403 || error.status === 401) return 'You don’t have permission to do that.'
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  let body: unknown
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      body = await res.json()
    } catch {
      body = await res.text()
    }
  } else {
    body = await res.text()
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `Request failed: ${res.status} ${res.statusText}`
    throw new ApiError(message, res.status, body)
  }

  return body as T
}

// --- Response types (align with backend) ---

export interface QueryResponse {
  query: string
  response: string
  sources: { file_name: string; score: number }[]
}

export interface DocumentItem {
  filename: string
  chunk_count: number
}

export interface DocumentsResponse {
  documents: DocumentItem[]
  count: number
}

import type { Runbook } from '@/lib/data'

// Backend may not expose this; typed for when endpoint exists
export type RunbooksResponse = Runbook[]

// --- API functions ---
// Backend mapping: search() → POST /query, getDocuments() → GET /documents, upload() → POST /upload

/**
 * Backend health check. GET /health
 */
export async function getHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health')
}

/**
 * Search the knowledge base. POST /query
 */
export async function search(query: string, topK = 5): Promise<QueryResponse> {
  return request<QueryResponse>('/query', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: topK }),
  })
}

/**
 * List ingested documents with chunk counts. GET /documents
 */
export async function getDocuments(): Promise<DocumentsResponse> {
  return request<DocumentsResponse>('/documents')
}

export interface UploadResponse {
  message: string
  chunks_stored: number
}

/**
 * Delete a document and all its chunks. DELETE /documents/{filename}
 */
export async function deleteDocument(filename: string): Promise<{ message: string; chunks_deleted: number }> {
  const encoded = encodeURIComponent(filename)
  return request<{ message: string; chunks_deleted: number }>(`/documents/${encoded}`, { method: 'DELETE' })
}

/**
 * Upload a document for ingestion. POST /upload (multipart/form-data).
 */
export async function upload(file: File): Promise<UploadResponse> {
  const url = `${BASE_URL}/upload`
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(url, {
    method: 'POST',
    body: form,
    // Do not set Content-Type; browser sets multipart/form-data with boundary
  })
  let body: unknown
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    body = await res.json()
  } else {
    body = await res.text()
  }
  if (!res.ok) {
    const message =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `Upload failed: ${res.status} ${res.statusText}`
    throw new ApiError(message, res.status, body)
  }
  return body as UploadResponse
}

/**
 * Fetch runbooks. GET /runbooks
 * Note: RAG backend may not implement this; call will throw ApiError if 404.
 */
export async function getRunbooks(): Promise<RunbooksResponse> {
  return request<RunbooksResponse>('/runbooks')
}
