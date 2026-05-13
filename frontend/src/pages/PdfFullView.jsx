import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const PDF_VIEWER_URL = '/NKP-Setup-Guide.pdf'
const PDF_S3_URL = import.meta.env.VITE_PDF_URL || PDF_VIEWER_URL

export default function PdfFullView() {
  const [numPages, setNumPages] = useState(null)
  const [page, setPage]         = useState(1)

  const onLoad = useCallback(({ numPages }) => setNumPages(numPages), [])

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600
                       hover:text-gray-900 transition-colors"
            title="Close tab"
          >
            <ArrowLeft size={16} />
            Close
          </button>
          <span className="text-sm font-semibold text-gray-800">NKP-Setup-Guide.pdf</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Page nav */}
          <div className="flex items-center gap-0.5 mr-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500 tabular-nums min-w-[3rem] text-center">
              {page}/{numPages ?? '\u2013'}
            </span>
            <button
              onClick={() => setPage(p => numPages ? Math.min(numPages, p + 1) : p)}
              disabled={!numPages || page >= numPages}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <a
            href={PDF_S3_URL}
            download="NKP-Setup-Guide.pdf"
            className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg
                       border border-nutanix-200 bg-white hover:bg-nutanix-50
                       text-nutanix-800 transition-all duration-150 active:scale-95"
          >
            <Download size={14} />
            Download
          </a>
        </div>
      </div>

      {/* Full-page PDF viewer */}
      <div className="flex-1 min-h-0 flex justify-center overflow-auto bg-gray-200 py-4">
        <Document file={PDF_VIEWER_URL} onLoadSuccess={onLoad} loading={<Loading />}>
          <div className="shadow-2xl">
            <Page pageNumber={page} width={window.innerWidth > 1200 ? 1000 : window.innerWidth - 64} />
          </div>
        </Document>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-nutanix-200 border-t-nutanix-700 rounded-full animate-spin" />
    </div>
  )
}
