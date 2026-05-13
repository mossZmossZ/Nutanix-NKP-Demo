import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  BookOpen, ChevronRight, ChevronLeft, Download,
  ExternalLink, ZoomIn, ZoomOut, FileText, AlertCircle,
} from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PDF_VIEWER_URL = '/NKP-Setup-Guide.pdf'
const PDF_S3_URL = import.meta.env.VITE_PDF_URL || PDF_VIEWER_URL
const MIN_SCALE = 0.5
const MAX_SCALE = 2.0
const SCALE_STEP = 0.15

export default function InstallationGuide() {
  const [numPages, setNumPages]   = useState(null)
  const [page, setPage]           = useState(1)
  const [scale, setScale]         = useState(1.0)
  const [error, setError]         = useState(false)
  const containerRef              = useRef(null)
  const [containerWidth, setContainerWidth] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) =>
      setContainerWidth(entry.contentRect.width)
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onLoad = useCallback(({ numPages }) => {
    setNumPages(numPages)
    setError(false)
  }, [])

  const prev    = useCallback(() => setPage(p => Math.max(1, p - 1)), [])
  const next    = useCallback(() => setPage(p => numPages ? Math.min(numPages, p + 1) : p), [numPages])
  const zoomOut = useCallback(() => setScale(s => parseFloat(Math.max(MIN_SCALE, s - SCALE_STEP).toFixed(2))), [])
  const zoomIn  = useCallback(() => setScale(s => parseFloat(Math.min(MAX_SCALE, s + SCALE_STEP).toFixed(2))), [])

  const pageWidth = containerWidth
    ? Math.max(280, Math.floor(containerWidth * 0.88 * scale))
    : undefined

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Home</span>
        <ChevronRight size={14} />
        <span className="text-nutanix-700 font-medium">Installation Guide</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-nutanix-100 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={24} className="text-nutanix-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NKP Installation Guide</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Step-by-step setup for Nutanix Kubernetes Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={PDF_S3_URL}
            download="NKP-Setup-Guide.pdf"
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg
                       border border-nutanix-200 bg-white hover:bg-nutanix-50
                       text-nutanix-800 transition-all duration-150 active:scale-95"
          >
            <Download size={15} />
            Download PDF
          </a>
          <a
            href={PDF_S3_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg
                       bg-nutanix-800 hover:bg-nutanix-900 text-white
                       transition-all duration-150 active:scale-95"
          >
            <ExternalLink size={15} />
            Open in Tab
          </a>
        </div>
      </div>

      {/* Viewer card */}
      <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={15} className="text-nutanix-600 shrink-0" />
            <span className="text-sm font-medium text-gray-600 truncate hidden sm:block">
              NKP-Setup-Guide.pdf
            </span>
            {numPages && (
              <span className="text-xs text-gray-400 hidden sm:block">
                · {numPages} pages
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-0.5">
              <ToolbarBtn onClick={zoomOut} disabled={scale <= MIN_SCALE} title="Zoom out">
                <ZoomOut size={15} />
              </ToolbarBtn>
              <span className="text-xs font-medium text-gray-600 w-11 text-center tabular-nums select-none">
                {Math.round(scale * 100)}%
              </span>
              <ToolbarBtn onClick={zoomIn} disabled={scale >= MAX_SCALE} title="Zoom in">
                <ZoomIn size={15} />
              </ToolbarBtn>
            </div>

            <div className="h-5 w-px bg-gray-300" />

            {/* Page navigation */}
            <div className="flex items-center gap-0.5">
              <ToolbarBtn onClick={prev} disabled={page <= 1} title="Previous page">
                <ChevronLeft size={15} />
              </ToolbarBtn>
              <span className="text-xs font-medium text-gray-600 tabular-nums select-none min-w-[3.5rem] text-center">
                {page}&nbsp;/&nbsp;{numPages ?? '\u2013'}
              </span>
              <ToolbarBtn
                onClick={next}
                disabled={!numPages || page >= numPages}
                title="Next page"
              >
                <ChevronRight size={15} />
              </ToolbarBtn>
            </div>
          </div>
        </div>

        {/* PDF canvas */}
        <div ref={containerRef} className="bg-gray-100 overflow-auto" style={{ minHeight: '72vh' }}>
          {error ? (
            <ErrorState />
          ) : (
            <div className="flex justify-center py-8 px-4">
              <Document
                file={PDF_VIEWER_URL}
                onLoadSuccess={onLoad}
                onLoadError={() => setError(true)}
                loading={<Spinner />}
              >
                <div className="rounded-lg overflow-hidden shadow-2xl">
                  <Page
                    pageNumber={page}
                    width={pageWidth}
                    loading={<PagePlaceholder width={pageWidth} />}
                  />
                </div>
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolbarBtn({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed
                 text-gray-600 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-nutanix-400"
    >
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-nutanix-200 border-t-nutanix-700 rounded-full animate-spin" />
    </div>
  )
}

function PagePlaceholder({ width }) {
  const h = Math.floor((width ?? 680) * 1.414)
  return (
    <div className="bg-white animate-pulse" style={{ width: width ?? 680, height: h }} />
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle size={26} className="text-red-400" />
      </div>
      <h3 className="text-gray-900 font-semibold mb-1">Could not load the PDF</h3>
      <p className="text-sm text-gray-500 mb-5">Try downloading the file directly instead.</p>
      <a
        href={PDF_S3_URL}
        download="NKP-Setup-Guide.pdf"
        className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg
                   bg-nutanix-800 hover:bg-nutanix-900 text-white transition-all duration-150"
      >
        <Download size={15} />
        Download PDF
      </a>
    </div>
  )
}
