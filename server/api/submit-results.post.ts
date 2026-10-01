export default defineEventHandler(async (event) => {
  const config = getGitHubConfig()

  if (!config.token) {
    setResponseStatus(event, 500)

    return { error: 'GitHub token not configured', success: false }
  }

  const parsed = submitResultsSchema.safeParse(await readBody(event).catch(() => undefined))

  if (!parsed.success) {
    setResponseStatus(event, 400)

    return { error: 'Invalid request body', success: false }
  }

  try {
    await submitResults(config, parsed.data)

    return { message: 'Results submitted successfully', success: true }
  } catch (error) {
    console.error('GitHub operation error:', error)
    setResponseStatus(event, 500)

    return {
      details: error instanceof Error ? error.message : 'Unknown error',
      error: 'Failed to submit to GitHub',
      success: false,
    }
  }
})
