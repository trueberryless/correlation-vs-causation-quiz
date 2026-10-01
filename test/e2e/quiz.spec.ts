import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

async function answerQuestion(page: Page, confidence = 80) {
  await page.locator('#confidence').fill(String(confidence))
  await page.getByTestId('answer-causal').click()
}

async function finishQuiz(page: Page) {
  await page.getByRole('button', { name: 'Start Quiz' }).click()

  for (let question = 1; question <= 10; question++) {
    await expect(page.getByTestId('progress')).toHaveText(`Question ${question} of 10`)
    await answerQuestion(page)
  }

  await expect(page.getByRole('heading', { name: /How many questions/ })).toBeVisible()
  await page.getByRole('button', { name: 'Submit Quiz' }).click()
  await expect(page.getByRole('heading', { name: 'Your Results' })).toBeVisible()
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()

  expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`)).toEqual(
    [],
  )
}

test.describe('quiz', () => {
  test('explains the difference and starts with five attempts', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Correlation vs Causation Quiz')
    await expect(page.getByRole('heading', { level: 1, name: 'Correlation vs Causation Quiz' })).toBeVisible()
    await expect(page.getByTestId('attempts-left')).toHaveText('Attempts left: 5')
  })

  test('requires the confidence to be set before answering', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Quiz' }).click()
    await page.getByTestId('answer-causal').click()

    await expect(page.getByRole('alert')).toContainText('adjust your confidence level')
    await expect(page.getByTestId('progress')).toHaveText('Question 1 of 10')
  })

  test('shows five causal and five correlation statements without repeating them', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Quiz' }).click()

    const statements = new Set<string>()

    for (let question = 0; question < 10; question++) {
      statements.add((await page.getByTestId('statement').textContent()) ?? '')
      await answerQuestion(page)
    }

    expect(statements.size).toBe(10)
  })

  test('walks through the quiz and shows the results', async ({ page }) => {
    await page.goto('/')
    await finishQuiz(page)

    const results = page.getByTestId('results')

    await expect(results).toContainText('Correct Answers')
    await expect(results).toContainText('80.0%')
    await expect(results).toContainText('5')
    await expect(page.getByRole('status').first()).toContainText('Error submitting data')
    await expect(page.getByRole('button', { name: 'Try Again (4 left)' })).toBeVisible()
  })

  test('remembers the attempts and the results in the browser', async ({ page }) => {
    await page.goto('/')
    await finishQuiz(page)
    await page.reload()

    await expect(page.getByTestId('attempts-left')).toHaveText('Attempts left: 4')

    const stored = await page.evaluate(() => {
      const userId = localStorage.getItem('quizUserId')

      return JSON.parse(localStorage.getItem(`quizResults_${userId}`) ?? '[]') as { total: number }[]
    })

    expect(stored).toHaveLength(1)
    expect(stored[0]?.total).toBe(10)
  })

  test('stops when there are no attempts left', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('quizAttempts', '0'))
    await page.goto('/')

    await expect(page.getByTestId('attempts-left')).toHaveText('No attempts left')
    await expect(page.getByRole('button', { name: 'Start Quiz' })).toBeDisabled()
  })

  test('lets you try again', async ({ page }) => {
    await page.goto('/')
    await finishQuiz(page)
    await page.getByRole('button', { name: 'Try Again (4 left)' }).click()

    await expect(page.getByRole('button', { name: 'Start Quiz' })).toBeVisible()
    await expect(page.getByTestId('attempts-left')).toHaveText('Attempts left: 4')
  })

  test('clamps the estimate to the number of questions', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Quiz' }).click()

    for (let question = 0; question < 10; question++) {
      await answerQuestion(page)
    }

    const estimate = page.getByLabel('Estimate')

    await expect(estimate).toHaveValue('5')
    await estimate.fill('99')
    await expect(estimate).toHaveValue('10')
    await page.getByRole('button', { name: 'Decrease' }).click()
    await expect(estimate).toHaveValue('9')
  })
})

test.describe('language', () => {
  test('switches between English and German and remembers the choice', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'DE', exact: true }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Korrelation vs. Kausalität Quiz')
    await expect(page.locator('html')).toHaveAttribute('lang', 'de-DE')

    await page.reload()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Korrelation vs. Kausalität Quiz')
  })

  test('shows the questions in the chosen language', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'DE', exact: true }).click()
    await page.getByRole('button', { name: 'Quiz starten' }).click()

    await expect(page.getByTestId('progress')).toHaveText('Frage 1 von 10')
  })
})

test.describe('statistics and difficulty', () => {
  test('show an empty state without GitHub data', async ({ page }) => {
    await page.goto('/stats')

    await expect(page.getByRole('heading', { level: 1, name: 'Statistics' })).toBeVisible()
    await expect(page.getByTestId('no-data')).toContainText('No data available yet')

    await page.goto('/difficulty')

    await expect(page.getByRole('heading', { level: 1, name: 'Question Difficulty Analysis' })).toBeVisible()
    await expect(page.getByTestId('no-data')).toContainText('No data available yet')
  })
})

test.describe('API', () => {
  test('returns no statistics without a GitHub token', async ({ request }) => {
    expect(await (await request.get('/api/get-stats')).json()).toEqual([])
    expect(await (await request.get('/api/question-difficulty')).json()).toEqual([])
  })

  test('does not accept results without a GitHub token', async ({ request }) => {
    const response = await request.post('/api/submit-results', { data: {} })

    expect(response.status()).toBe(500)
    expect(await response.json()).toEqual({ error: 'GitHub token not configured', success: false })
  })
})

test.describe('metadata', () => {
  test('has the canonical url, the favicon and the standard Open Graph image', async ({ page }) => {
    await page.goto('/stats')

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://correlation-vs-causation-quiz.felixs.dev/stats',
    )
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://correlation-vs-causation-quiz.felixs.dev/og-image.png',
    )
  })
})

test.describe('accessibility', () => {
  for (const colorScheme of ['dark', 'light'] as const) {
    test(`has no violations on any step in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto('/')
      await expectNoViolations(page)

      await page.getByRole('button', { name: 'Start Quiz' }).click()
      await expectNoViolations(page)

      for (let question = 0; question < 10; question++) {
        await answerQuestion(page)
      }

      await expectNoViolations(page)
      await page.getByRole('button', { name: 'Submit Quiz' }).click()
      await expect(page.getByRole('heading', { name: 'Your Results' })).toBeVisible()
      await expectNoViolations(page)
    })

    test(`has no violations on the statistics pages in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })

      for (const path of ['/stats', '/difficulty']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expectNoViolations(page)
      }
    })
  }

  test('does not scroll horizontally', async ({ page }) => {
    await page.goto('/')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )

    expect(overflow).toBeLessThanOrEqual(0)
  })
})
