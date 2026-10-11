import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  createBranchName,
  createPullRequestText,
  decodeResults,
  encodeResults,
  fetchAllResults,
  getGitHubConfig,
  getResultsFilePath,
  submitResults,
} from '../../server/utils/github'
import type { QuizResult } from '../../shared/types'

const result: QuizResult = {
  answers: [],
  avgConfidence: 82.5,
  correct: 7,
  estimate: 6,
  percentage: 70,
  timestamp: '2026-06-05T15:17:50.272Z',
  total: 10,
}
const config = { owner: 'owner', repository: 'repository', token: 'token' }
const userId = 'V1StGXR8_Z5jdHi6B-myT'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('getGitHubConfig', () => {
  test('uses the defaults', () => {
    vi.stubEnv('PUBLIC_REPO_OWNER', '')
    vi.stubEnv('PUBLIC_REPO_NAME', '')
    vi.stubEnv('GITHUB_TOKEN', '')

    expect(getGitHubConfig()).toEqual({
      owner: 'trueberryless',
      repository: 'correlation-vs-causation-quiz',
      token: '',
    })
  })

  test('reads the environment', () => {
    vi.stubEnv('PUBLIC_REPO_OWNER', 'someone')
    vi.stubEnv('PUBLIC_REPO_NAME', 'repo')
    vi.stubEnv('GITHUB_TOKEN', 'secret')

    expect(getGitHubConfig()).toEqual({ owner: 'someone', repository: 'repo', token: 'secret' })
  })
})

describe('helpers', () => {
  test('puts results into the results folder', () => {
    expect(getResultsFilePath(userId)).toBe(`results/${userId}.json`)
  })

  test('round-trips results through base64', () => {
    expect(decodeResults(encodeResults([result]))).toEqual([result])
  })

  test('names branches after the user and the time', () => {
    expect(createBranchName(userId, 123)).toBe(`results-${userId}-123`)
  })

  test('describes the pull request', () => {
    expect(createPullRequestText(userId, result)).toEqual({
      body: 'Automated quiz result submission\n\nUser: V1StGXR8...\nScore: 7/10\nAverage Confidence: 82.5%\nEstimate: 6',
      title: 'Quiz Results: 7/10 correct (70.0%)',
    })
  })
})

describe('fetchAllResults', () => {
  test('returns nothing without a token', async () => {
    const fetchMock = vi.fn()

    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchAllResults({ ...config, token: undefined })).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('collects the results of all json files', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/contents/results')) {
          return json([
            { download_url: 'https://raw.example/a.json', name: 'a.json', type: 'file' },
            { download_url: 'https://raw.example/b.json', name: 'b.json', type: 'file' },
            { download_url: 'https://raw.example/readme.md', name: 'readme.md', type: 'file' },
            { download_url: null, name: 'c.json', type: 'file' },
            { download_url: 'https://raw.example/dir', name: 'dir.json', type: 'dir' },
          ])
        }

        return url.endsWith('a.json')
          ? json([result])
          : json([
              { ...result, correct: 1 },
              { ...result, correct: 2 },
            ])
      }),
    )

    const results = await fetchAllResults(config)

    expect(results.map(({ correct }) => correct)).toEqual([7, 1, 2])
  })

  test('sends the token to the GitHub API', async () => {
    const fetchMock = vi.fn(async () => json([]))

    vi.stubGlobal('fetch', fetchMock)
    await fetchAllResults(config)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repository/contents/results',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }),
    )
  })

  test('returns nothing when the folder cannot be listed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ message: 'Not Found' }, 404)),
    )

    expect(await fetchAllResults(config)).toEqual([])
  })

  test('skips files that cannot be downloaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/contents/results')) {
          return json([
            { download_url: 'https://raw.example/ok.json', name: 'ok.json', type: 'file' },
            { download_url: 'https://raw.example/broken.json', name: 'broken.json', type: 'file' },
            { download_url: 'https://raw.example/missing.json', name: 'missing.json', type: 'file' },
          ])
        }

        if (url.endsWith('broken.json')) {
          throw new Error('network')
        }

        return url.endsWith('ok.json') ? json([result]) : json({}, 404)
      }),
    )

    expect(await fetchAllResults(config)).toEqual([result])
  })

  test('returns nothing when GitHub cannot be reached', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    )

    expect(await fetchAllResults(config)).toEqual([])
  })
})

describe('submitResults', () => {
  function createGitHub({
    existing,
    failAt,
    failMethod,
  }: { existing?: QuizResult[]; failAt?: string; failMethod?: string } = {}) {
    const calls: { body: Record<string, unknown> | undefined; method: string; url: string }[] = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: { body?: string; method?: string } = {}) => {
        const path = url.replace('https://api.github.com/repos/owner/repository/', '')

        calls.push({ body: init.body ? JSON.parse(init.body) : undefined, method: init.method ?? 'GET', url: path })

        if (failAt === path && (!failMethod || failMethod === (init.method ?? 'GET'))) {
          return json({ message: 'failed' }, 500)
        }

        if (path.startsWith('contents/') && !init.method) {
          return existing ? json({ content: encodeResults(existing), sha: 'old-sha' }) : json({}, 404)
        }

        return path === 'git/refs/heads/main' ? json({ object: { sha: 'main-sha' } }) : json({})
      }),
    )

    return calls
  }

  const submission = { results: [result], userId }

  test('creates a branch, a file and a pull request', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const calls = createGitHub()

    await submitResults(config, submission)

    expect(calls.map(({ method, url }) => `${method} ${url}`)).toEqual([
      `GET contents/results/${userId}.json`,
      'GET git/refs/heads/main',
      'POST git/refs',
      `PUT contents/results/${userId}.json`,
      'POST pulls',
    ])
    expect(calls[2]?.body).toEqual({ ref: `refs/heads/results-${userId}-1000`, sha: 'main-sha' })
    expect(calls[3]?.body).toMatchObject({
      branch: `results-${userId}-1000`,
      message: 'Add quiz results for user V1StGXR8',
    })
    expect(calls[3]?.body).not.toHaveProperty('sha')
    expect(calls[4]?.body).toMatchObject({
      base: 'main',
      head: `results-${userId}-1000`,
      title: 'Quiz Results: 7/10 correct (70.0%)',
    })
  })

  test('appends to the results of the user', async () => {
    const calls = createGitHub({ existing: [{ ...result, correct: 3 }] })

    await submitResults(config, submission)

    const put = calls.find(({ method }) => method === 'PUT')

    expect(put?.body).toMatchObject({ sha: 'old-sha' })
    expect(decodeResults(put?.body?.['content'] as string).map(({ correct }) => correct)).toEqual([3, 7])
  })

  test.each([
    ['git/refs/heads/main', 'GET', 'Failed to get main branch'],
    ['git/refs', 'POST', 'Failed to create branch'],
    [`contents/results/${userId}.json`, 'PUT', 'Failed to update file'],
  ])('fails when %s fails', async (failAt, failMethod, message) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    createGitHub({ failAt, failMethod })

    await expect(submitResults(config, submission)).rejects.toThrow(message)
  })

  test('succeeds even when the pull request cannot be created', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    createGitHub({ failAt: 'pulls' })

    await expect(submitResults(config, submission)).resolves.toBeUndefined()
  })
})
