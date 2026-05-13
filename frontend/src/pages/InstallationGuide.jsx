import { useState, useEffect } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

const PLACEHOLDER_CONTENT = `# NKP Installation Guide

## Prerequisites

- Linux/macOS workstation
- AWS / Azure / vSphere credentials
- kubectl v1.27+
- Helm v3.12+

## Step 1: Install NKP CLI

\`\`\`bash
curl -fsSL https://get.nkp.io | sh
nkp version
\`\`\`

## Step 2: Configure Cloud Credentials

\`\`\`bash
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>
export AWS_REGION=us-east-1
\`\`\`

## Step 3: Create Management Cluster

\`\`\`bash
nkp create cluster aws \\
  --cluster-name nkp-management \\
  --kubernetes-version 1.28.0 \\
  --control-plane-count 3 \\
  --worker-node-count 4
\`\`\`

## Step 4: Verify Installation

\`\`\`bash
kubectl get nodes
kubectl get pods -A
\`\`\`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Nodes NotReady | Check CNI plugin installation |
| API server unreachable | Verify security group rules |
| Image pull errors | Check container registry credentials |
`

export default function InstallationGuide() {
  const [content, setContent] = useState(PLACEHOLDER_CONTENT)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/content/installation-guide')
        if (data?.content) setContent(data.content)
      } catch {
        // Use placeholder content on error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span>Home</span>
        <ChevronRight size={14} />
        <span className="text-nutanix-700 font-medium">Installation Guide</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-nutanix-100 rounded-xl flex items-center justify-center">
          <BookOpen size={24} className="text-nutanix-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NKP Installation Guide</h1>
          <p className="text-gray-500 text-sm mt-0.5">Step-by-step setup for Nutanix Kubernetes Platform</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-nutanix-200 border-t-nutanix-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="prose prose-slate max-w-none
          prose-headings:text-gray-900 prose-headings:font-bold
          prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
          prose-code:bg-nutanix-50 prose-code:text-nutanix-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-nutanix-950 prose-pre:text-nutanix-100
          prose-a:text-nutanix-700 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900
          prose-table:border prose-td:border prose-th:border prose-th:bg-nutanix-50">
          <MarkdownRenderer content={content} />
        </div>
      )}
    </div>
  )
}

function MarkdownRenderer({ content }) {
  // Simple markdown to HTML - in production use react-markdown
  const lines = content.split('\n')
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(2)}</h1>
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3 pb-2 border-b border-gray-200">{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>
        if (line.startsWith('```')) return null
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700">{line.slice(2)}</li>
        if (line.trim() === '') return <div key={i} className="h-2" />
        return <p key={i} className="text-gray-700 leading-relaxed">{line}</p>
      })}
    </div>
  )
}
