import { useAuth } from '@/context/AuthContext'
import { Server, Key, FileCode, BookOpen } from 'lucide-react'

const quickLinks = [
  { icon: Key, label: 'Cluster Credentials', desc: 'Access your assigned cluster endpoints and credentials.', href: '#credentials' },
  { icon: FileCode, label: 'YAML Templates', desc: 'Download sample manifests and deployment files.', href: '#yaml' },
  { icon: BookOpen, label: 'Lab Walkthroughs', desc: 'Follow guided labs for common NKP operations.', href: '#labs' },
]

export default function DemoDashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-card-gradient rounded-xl flex items-center justify-center">
          <Server size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demo Portal</h1>
          <p className="text-gray-500 text-sm">Welcome back, <span className="font-medium text-nutanix-700">{user?.username}</span></p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {quickLinks.map(({ icon: Icon, label, desc, href }) => (
          <a key={label} href={href} className="card-hover flex gap-4">
            <div className="w-10 h-10 bg-nutanix-100 rounded-lg flex items-center justify-center shrink-0">
              <Icon size={20} className="text-nutanix-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Placeholder sections */}
      <section id="credentials" className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cluster Credentials</h2>
        <div className="bg-nutanix-50 border border-nutanix-200 rounded-lg p-4 text-sm text-nutanix-800">
          Credentials will be loaded from the backend API. Configure your cluster in the admin panel.
        </div>
      </section>

      <section id="yaml" className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">YAML Templates</h2>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          Sample YAML files will appear here once uploaded via the admin panel.
        </div>
      </section>

      <section id="labs" className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Walkthroughs</h2>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          Lab content will be loaded from the content management system.
        </div>
      </section>
    </div>
  )
}
