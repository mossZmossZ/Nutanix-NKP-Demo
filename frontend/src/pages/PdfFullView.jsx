import { ArrowLeft, Download } from 'lucide-react'

const PDF_URL = import.meta.env.VITE_PDF_URL || '/NKP-Setup-Guide.pdf'

export default function PdfFullView() {
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

        <a
          href={PDF_URL}
          download="NKP-Setup-Guide.pdf"
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg
                     border border-nutanix-200 bg-white hover:bg-nutanix-50
                     text-nutanix-800 transition-all duration-150 active:scale-95"
        >
          <Download size={14} />
          Download
        </a>
      </div>

      {/* Full-page PDF viewer */}
      <div className="flex-1 min-h-0">
        <iframe
          src={PDF_URL}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="NKP Setup Guide"
        />
      </div>
    </div>
  )
}
