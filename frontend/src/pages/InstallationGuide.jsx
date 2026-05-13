import { BookOpen, ChevronRight, Download, ExternalLink } from 'lucide-react'

const PDF_URL = import.meta.env.VITE_PDF_URL || '/NKP-Setup-Guide.pdf'

export default function InstallationGuide() {
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
            href={PDF_URL}
            download="NKP-Setup-Guide.pdf"
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg
                       border border-nutanix-200 bg-white hover:bg-nutanix-50
                       text-nutanix-800 transition-all duration-150 active:scale-95"
          >
            <Download size={15} />
            Download PDF
          </a>
          <a
            href={PDF_URL}
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

      {/* PDF Viewer */}
      <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <iframe
          src={PDF_URL}
          style={{ width: '100%', height: '78vh', border: 'none' }}
          title="NKP Setup Guide"
        />
      </div>
    </div>
  )
}
