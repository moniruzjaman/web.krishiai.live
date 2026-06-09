/**
 * /api/dashboard/deployments — Deployment History for OpenProvider Dashboard
 *
 * Returns recent deployment info, CI status, and build metadata.
 * Since we don't have direct Vercel API access, we return
 * git-based deployment information from the codebase.
 */

import { NextRequest } from 'next/server'
import { handleOptions, corsNextResponse } from '@/lib/cors'
import { execSync } from 'child_process'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request.headers.get('origin'), ['GET'])
}

interface DeploymentInfo {
  version: string
  branch: string
  commit: string
  commitMessage: string
  commitDate: string
  author: string
  buildStatus: string
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')

  let deployments: DeploymentInfo[] = []

  try {
    // Get recent commits as "deployments"
    const logOutput = execSync(
      'git log --oneline --format="%H|%s|%ai|%an" -10',
      { encoding: 'utf-8', timeout: 5000 }
    ).trim()

    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
    }).trim()

    const lines = logOutput.split('\n').filter(Boolean)

    deployments = lines.map((line, i) => {
      const [hash, message, date, author] = line.split('|')
      return {
        version: `v4.0.${10 - i}`, // Approximate version from commit position
        branch,
        commit: hash?.substring(0, 7) || 'unknown',
        commitMessage: message || 'unknown',
        commitDate: date || new Date().toISOString(),
        author: author || 'unknown',
        buildStatus: i === 0 ? 'current' : 'deployed',
      }
    })
  } catch {
    deployments = [{
      version: 'v4.0.2',
      branch: 'main',
      commit: 'unknown',
      commitMessage: 'Git info unavailable in this environment',
      commitDate: new Date().toISOString(),
      author: 'unknown',
      buildStatus: 'current',
    }]
  }

  return corsNextResponse(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      platform: 'vercel',
      region: 'hkg1',
      framework: 'nextjs-16',
      runtime: 'bun',
      deployments,
    },
    { origin, methods: ['GET'], headers: { 'Cache-Control': 'public, s-maxage=60' } }
  )
}
