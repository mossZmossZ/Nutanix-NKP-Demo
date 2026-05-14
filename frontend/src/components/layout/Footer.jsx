import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'

const NAV = [
  {
    title: 'Platform',
    links: [
      { label: 'Installation Guide', to: '/installation' },
      { label: 'Demo Portal', to: '/demo' },
      { label: 'Workshop Portal', to: '/workshop' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Nutanix.com', href: 'https://www.nutanix.com' },
      { label: 'Nutanix Portal', href: 'https://portal.nutanix.com' },
      { label: 'NKP Documentation', href: 'https://docs.d2iq.com' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-nutanix-950 border-t-2 border-nutanix-700">

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand — 5 / 12 cols */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-nutanix-700 flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-sm">N</span>
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">Nutanix NKP Demo</p>
                <p className="text-nutanix-400 text-xs mt-0.5">E-Learning Platform</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              A hands-on learning platform for Nutanix Kubernetes Platform — covering
              installation, cluster management, and guided lab exercises for NKP practitioners.
            </p>

            <a
              href="https://www.nutanix.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-nutanix-300 hover:text-white border border-nutanix-800 hover:border-nutanix-600 rounded-full px-4 py-1.5 transition-colors duration-150"
            >
              Visit Nutanix.com
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1" />

          {/* Nav columns — 3 cols each */}
          {NAV.map(({ title, links }) => (
            <div key={title} className="md:col-span-3">
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-5">
                {title}
              </h4>
              <ul className="space-y-3.5">
                {links.map((item) => (
                  <li key={item.label}>
                    {'href' in item ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors duration-150"
                      >
                        {item.label}
                        <ExternalLink size={11} className="opacity-0 group-hover:opacity-60 transition-opacity duration-150" />
                      </a>
                    ) : (
                      <Link
                        to={item.to}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-150"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-nutanix-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Nutanix NKP Demo Platform — Internal training use only.
          </p>
          <p className="text-xs text-gray-500">
            Powered by <span className="text-nutanix-400 font-medium">Nattavee</span>
          </p>
        </div>
      </div>

    </footer>
  )
}
