import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, Server, GraduationCap,
  CheckCircle, Terminal, Shield, Layers, BarChart2,
} from 'lucide-react'

/* ── Data ────────────────────────────────────────────── */

const stats = [
  { value: '3', label: 'Portals' },
  { value: '50+', label: 'Lab exercises' },
  { value: '100%', label: 'Hands-on' },
]

const features = [
  {
    icon: Terminal,
    title: 'Installation Walkthrough',
    desc: 'Step-by-step NKP setup with verified commands for AWS, Azure, and vSphere.',
  },
  {
    icon: Shield,
    title: 'Secure Portal Access',
    desc: 'JWT-based authentication with role and portal-level access control.',
  },
  {
    icon: Layers,
    title: 'Real Cluster Credentials',
    desc: 'Encrypted cluster endpoints and credentials managed per user session.',
  },
  {
    icon: BarChart2,
    title: 'Progress Tracking',
    desc: 'Track lab completions and module progress across workshop sessions.',
  },
]

const included = [
  'Complete NKP installation walkthrough',
  'Cluster credential management',
  'Sample YAML file library',
  'Guided lab exercises',
  'Role-based portal access',
  'Progress tracking per user',
]

/* ── Component ───────────────────────────────────────── */

export default function Home() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <span className="badge-outline mb-5">
                Nutanix Kubernetes Platform
              </span>

              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-gray-900 mt-4 mb-6">
                Master NKP<br />
                <span className="text-gradient">with Confidence</span>
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
                Access guided installation docs, cluster credentials, sample workloads,
                and hands-on lab exercises — all in one platform built for NKP practitioners.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/installation" className="btn-primary">
                  Get Started <ArrowRight size={16} />
                </Link>
                <Link to="/demo" className="btn-secondary">
                  Demo Portal
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-gray-100">
                {stats.map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal card */}
            <div className="hidden lg:block">
              <TerminalCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Portals ───────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Choose Your Portal</h2>
            <p className="section-subheading">
              Tailored experiences for live demos and hands-on workshops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <PortalCard
              icon={<Server size={22} />}
              label="Demo Portal"
              color="purple"
              title="Live Cluster Access"
              description="Access cluster credentials, download YAML templates, and follow guided walkthroughs for live NKP demonstrations."
              to="/demo"
              cta="Access Demo Portal"
            />
            <PortalCard
              icon={<GraduationCap size={22} />}
              label="Workshop Portal"
              color="indigo"
              title="Structured Learning"
              description="Structured learning modules, hands-on lab exercises, and progress tracking for NKP workshop participants."
              to="/workshop"
              cta="Access Workshop"
            />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Built for NKP Practitioners</h2>
            <p className="section-subheading max-w-xl mx-auto">
              From first-install to production-ready operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card group hover:border-nutanix-200 hover:shadow-md transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-nutanix-50 group-hover:bg-nutanix-100 flex items-center justify-center mb-4 transition-colors duration-200">
                  <Icon size={20} className="text-nutanix-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's Included ───────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="badge-purple mb-4">Platform Features</span>
              <h2 className="section-heading mt-3">Everything you need for NKP learning</h2>
              <p className="section-subheading mb-8">
                Structured content that takes you from zero to production-ready.
              </p>
              <ul className="space-y-3.5">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                    <CheckCircle size={16} className="text-nutanix-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/installation" className="btn-primary">
                  <BookOpen size={16} />
                  View Installation Guide
                </Link>
              </div>
            </div>

            {/* Code block */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
              <div className="bg-gray-900 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-400 font-mono">terminal</span>
              </div>
              <div className="bg-gray-950 p-6 font-mono text-sm space-y-2">
                <CodeLine prompt="$" command="nkp create cluster aws \\" />
                <CodeLine indent command="  --cluster-name nkp-demo \\" />
                <CodeLine indent command="  --kubernetes-version 1.28.0" />
                <div className="h-2" />
                <CodeLine prompt=">" output="Creating management cluster..." color="text-yellow-400" />
                <CodeLine prompt=">" output="Provisioning control plane..." color="text-yellow-400" />
                <CodeLine prompt=">" output="Installing core addons..." color="text-yellow-400" />
                <div className="h-2" />
                <CodeLine prompt="✓" output="Cluster nkp-demo is ready" color="text-emerald-400" />
                <div className="h-2" />
                <CodeLine prompt="$" command="kubectl get nodes" />
                <div className="text-gray-400 pl-4 text-xs mt-1">
                  <p>NAME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;ROLES</p>
                  <p className="text-gray-300">control-plane-1&nbsp;&nbsp;Ready&nbsp;&nbsp;&nbsp;control-plane</p>
                  <p className="text-gray-300">worker-node-1&nbsp;&nbsp;&nbsp;&nbsp;Ready&nbsp;&nbsp;&nbsp;{'<none>'}</p>
                  <p className="text-gray-300">worker-node-2&nbsp;&nbsp;&nbsp;&nbsp;Ready&nbsp;&nbsp;&nbsp;{'<none>'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="bg-nutanix-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
            Ready to get started?
          </h2>
          <p className="text-nutanix-300 mb-8 max-w-md mx-auto">
            Begin with the installation guide or jump into a portal.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/installation"
              className="bg-white text-nutanix-900 hover:bg-nutanix-50 active:scale-95 font-semibold px-7 py-2.5 rounded-lg transition-all duration-150"
            >
              Installation Guide
            </Link>
            <Link to="/demo" className="btn-outline-white px-7 py-2.5">
              Demo Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────── */

function TerminalCard() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-nutanix-100 rounded-3xl blur-2xl opacity-60" />

      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
        {/* Title bar */}
        <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-3 text-xs text-gray-400 font-mono">nkp — bash</span>
        </div>

        {/* Terminal body */}
        <div className="bg-gray-950 p-6 font-mono text-sm space-y-2 min-h-[280px]">
          <CodeLine prompt="$" command="nkp version" />
          <p className="text-gray-400 pl-4">nkp/v2.4.0 linux/amd64</p>
          <div className="h-2" />
          <CodeLine prompt="$" command="nkp create cluster aws \\" />
          <CodeLine indent command="  --cluster-name demo" />
          <div className="h-2" />
          <CodeLine prompt="›" output="Bootstrapping cluster..." color="text-yellow-400" />
          <CodeLine prompt="›" output="Installing KubeAddons..." color="text-yellow-400" />
          <div className="h-2" />
          <CodeLine prompt="✓" output="Cluster is ready!" color="text-emerald-400" />
          <div className="h-2" />
          <div className="flex items-center gap-1 text-gray-400">
            <span className="text-nutanix-400">$</span>
            <span className="ml-2 text-gray-200">_</span>
            <span className="w-2 h-4 bg-nutanix-500 animate-pulse ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeLine({ prompt, command, output, indent, color = 'text-gray-200' }) {
  if (indent) {
    return <p className={`pl-4 ${color}`}>{command}</p>
  }
  return (
    <p className="flex items-start gap-2">
      <span className="text-nutanix-400 shrink-0">{prompt}</span>
      <span className={output ? color : 'text-gray-200'}>{command || output}</span>
    </p>
  )
}

function PortalCard({ icon, label, color, title, description, to, cta }) {
  const accent = color === 'indigo'
    ? 'bg-indigo-600'
    : 'bg-nutanix-800'

  const badgeCls = color === 'indigo'
    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
    : 'bg-nutanix-50 text-nutanix-700 border border-nutanix-100'

  return (
    <div className="card-hover flex flex-col">
      {/* Icon + label */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className={`badge ${badgeCls} text-xs`}>{label}</span>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">{description}</p>

      <Link
        to={to}
        className={`inline-flex items-center gap-2 font-semibold text-sm
          ${color === 'indigo' ? 'text-indigo-700 hover:text-indigo-900' : 'text-nutanix-700 hover:text-nutanix-900'}
          transition-colors duration-150 group`}
      >
        {cta}
        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-150" />
      </Link>
    </div>
  )
}
