export default defineEventHandler(async (event) => {
  const results = await fetchAllResults(getGitHubConfig())

  if (results.length > 0) {
    setHeader(event, 'Cache-Control', 'public, max-age=60')
  }

  return results
})
