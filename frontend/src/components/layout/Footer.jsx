import { Link } from 'react-router-dom'

const links = {
  Portals: [
    { label: 'Installation Guide', to: '/installation' },
    { label: 'Demo Portal', to: '/demo' },
    { label: 'Workshop Portal', to: '/workshop' },
  ],
  Resources: [
    { label: 'Nutanix.com', href: 'https://www.nutanix.com' },
    { label: 'Nutanix Portal', href: 'https://portal.nutanix.com' },
    { label: 'NKP Docs', href: 'https://docs.d2iq.com' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-nutanix-800 flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">
                Nutanix <span className="text-nutanix-700">NKP</span> Demo
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Hands-on learning platform for Nutanix Kubernetes Platform deployment and operations.
            </p>
          </div>

          {/* Nav groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {group}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    {'href' in item ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-gray-500 hover:text-nutanix-700 transition-colors duration-150"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        to={item.to}
                        className="text-sm text-gray-500 hover:text-nutanix-700 transition-colors duration-150"
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

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Nutanix NKP Demo Platform. Internal training use only.
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
