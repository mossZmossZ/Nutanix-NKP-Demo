import { useAuth } from '@/context/AuthContext'
import { GraduationCap, BookOpen, FlaskConical, BarChart3 } from 'lucide-react'

const sections = [
  { icon: BookOpen, label: 'Learning Modules', desc: 'Structured NKP learning paths.', href: '#modules' },
  { icon: FlaskConical, label: 'Lab Exercises', desc: 'Hands-on practice environments.', href: '#labs' },
  { icon: BarChart3, label: 'My Progress', desc: 'Track your completion across modules.', href: '#progress' },
]

export default function WorkshopDashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 to-nutanix-700 rounded-xl flex items-center justify-center">
          <GraduationCap size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshop Portal</h1>
          <p className="text-gray-500 text-sm">Welcome, <span className="font-medium text-nutanix-700">{user?.username}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {sections.map(({ icon: Icon, label, desc, href }) => (
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

      <section id="modules" className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning Modules</h2>
        <div className="bg-nutanix-50 border border-nutanix-200 rounded-lg p-4 text-sm text-nutanix-800">
          Learning modules will be loaded from the content API.
        </div>
      </section>

      <section id="labs" className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lab Exercises</h2>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          Lab exercises will appear here once configured.
        </div>
      </section>

      <section id="progress" className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Progress</h2>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
          Progress tracking will be available once you begin learning modules.
        </div>
      </section>
    </div>
  )
}
