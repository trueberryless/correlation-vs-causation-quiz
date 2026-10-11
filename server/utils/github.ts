import { RESULTS_FOLDER } from '../../shared/constants'
import type { QuizResult } from '../../shared/types'

import type { SubmitResults } from './validation'

interface GitHubConfig {
  owner: string
  repository: string
  token: string | undefined
}

interface GitHubFile {
  content: string
  sha: string
}

interface GitHubDirectoryEntry {
  download_url: string | null
  name: string
  type: string
}

export function getGitHubConfig(): GitHubConfig {
  return {
    owner: process.env['PUBLIC_REPO_OWNER'] || 'trueberryless',
    repository: process.env['PUBLIC_REPO_NAME'] || 'correlation-vs-causation-quiz',
    token: process.env['GITHUB_TOKEN'],
  }
}

export function getResultsFilePath(userId: string) {
  return `${RESULTS_FOLDER}/${userId}.json`
}

export function encodeResults(results: readonly QuizResult[]) {
  return Buffer.from(JSON.stringify(results, undefined, 2)).toString('base64')
}

export function decodeResults(content: string) {
  return JSON.parse(Buffer.from(content, 'base64').toString('utf8')) as QuizResult[]
}

export function createBranchName(userId: string, timestamp: number) {
  return `results-${userId}-${timestamp}`
}

export function createPullRequestText(
  userId: string,
  { avgConfidence, correct, estimate, percentage, total }: QuizResult,
) {
  return {
    body: [
      'Automated quiz result submission',
      '',
      `User: ${userId.slice(0, 8)}...`,
      `Score: ${correct}/${total}`,
      `Average Confidence: ${avgConfidence.toFixed(1)}%`,
      `Estimate: ${estimate}`,
    ].join('\n'),
    title: `Quiz Results: ${correct}/${total} correct (${percentage.toFixed(1)}%)`,
  }
}

function createClient({ owner, repository, token }: GitHubConfig) {
  const baseUrl = `https://api.github.com/repos/${owner}/${repository}`
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }

  return {
    get: (path: string) => fetch(`${baseUrl}/${path}`, { headers }),
    send: (path: string, method: 'POST' | 'PUT', body: unknown) =>
      fetch(`${baseUrl}/${path}`, {
        body: JSON.stringify(body),
        headers: { ...headers, 'Content-Type': 'application/json' },
        method,
      }),
  }
}

export async function fetchAllResults(config: GitHubConfig) {
  if (!config.token) {
    return []
  }

  try {
    const response = await createClient(config).get(`contents/${RESULTS_FOLDER}`)

    if (!response.ok) {
      return []
    }

    const files = ((await response.json()) as GitHubDirectoryEntry[]).filter(
      ({ download_url, name, type }) => type === 'file' && name.endsWith('.json') && download_url,
    )

    const resultsPerFile = await Promise.all(
      files.map(async ({ download_url, name }) => {
        try {
          const fileResponse = await fetch(download_url!)

          return fileResponse.ok ? ((await fileResponse.json()) as QuizResult[]) : []
        } catch (error) {
          console.error(`Error fetching ${name}:`, error)

          return []
        }
      }),
    )

    return resultsPerFile.flat()
  } catch (error) {
    console.error('GitHub fetch error:', error)

    return []
  }
}

export async function submitResults(config: GitHubConfig, { results, userId }: SubmitResults) {
  const client = createClient(config)
  const filePath = getResultsFilePath(userId)

  const existingResponse = await client.get(`contents/${filePath}`)
  let existingResults: QuizResult[] = []
  let sha: string | undefined

  if (existingResponse.ok) {
    const file = (await existingResponse.json()) as GitHubFile

    sha = file.sha
    existingResults = decodeResults(file.content)
  }

  const mainResponse = await client.get('git/refs/heads/main')

  if (!mainResponse.ok) {
    throw new Error('Failed to get main branch')
  }

  const mainSha = ((await mainResponse.json()) as { object: { sha: string } }).object.sha
  const branchName = createBranchName(userId, Date.now())

  const branchResponse = await client.send('git/refs', 'POST', { ref: `refs/heads/${branchName}`, sha: mainSha })

  if (!branchResponse.ok) {
    throw new Error('Failed to create branch')
  }

  const fileResponse = await client.send(`contents/${filePath}`, 'PUT', {
    branch: branchName,
    content: encodeResults([...existingResults, ...(results as QuizResult[])]),
    message: `Add quiz results for user ${userId.slice(0, 8)}`,
    ...(sha && { sha }),
  })

  if (!fileResponse.ok) {
    console.error('GitHub API Error:', await fileResponse.json())

    throw new Error('Failed to update file')
  }

  const latest = results.at(-1) as QuizResult
  const pullRequestResponse = await client.send('pulls', 'POST', {
    base: 'main',
    head: branchName,
    ...createPullRequestText(userId, latest),
  })

  if (!pullRequestResponse.ok) {
    console.error('Failed to create PR:', await pullRequestResponse.json())
  }
}
