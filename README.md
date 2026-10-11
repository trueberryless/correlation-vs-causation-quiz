# Correlation vs Causation Quiz

[![Netlify Status](https://api.netlify.com/api/v1/badges/3fa8711c-4139-47a1-be5a-591103950742/deploy-status)](https://app.netlify.com/projects/correlation-vs-causation-quiz/deploys)

An interactive quiz to test your ability to distinguish between correlation and causation.

## Features

- English and German, with the language remembered in a cookie
- 10 random questions per attempt (5 causal, 5 correlation)
- A confidence rating (50-100 %) for every answer, which has to be set before answering
- Up to 5 attempts per device
- A statistics page with the global results and a difficulty analysis of every question
- Results are stored locally and submitted to this repository through a server endpoint

## How it works

1. A visitor gets 10 random questions, 5 causal and 5 correlation ones, from `shared/data/questions.json`.
2. For each question they set their confidence and choose "Causal relationship" or "Just correlation".
3. After the last question they estimate how many answers were correct.
4. The result is saved in the browser and sent to `POST /api/submit-results`. The endpoint appends it to `results/<anonymous id>.json` in a new branch and opens a pull request.
5. `GET /api/get-stats` returns all results that were merged into the `results/` folder and `GET /api/question-difficulty` ranks the questions by their error rate, weighted by the number of attempts.

## Development

Requires Node.js 24 and pnpm.

```shell
pnpm install
pnpm dev
```

Without a GitHub token the quiz works, the statistics are empty and submitting results fails (the quiz tells the visitor that the results were only saved locally).

### Environment variables

Create a `.env` file to try the submission:

```
GITHUB_TOKEN=a personal access token with the repo scope
PUBLIC_REPO_OWNER=trueberryless
PUBLIC_REPO_NAME=correlation-vs-causation-quiz
```

The token is only used on the server. Requests are validated with Zod: one result per request, an anonymous id of 10 to 40 characters (letters, digits, `_` and `-`) and the value ranges of the quiz.

### Commands

| Command             | Description                                     |
| ------------------- | ----------------------------------------------- |
| `pnpm check`        | Type check with `nuxt typecheck`                |
| `pnpm lint`         | Lint with oxlint                                |
| `pnpm format:check` | Check formatting with oxfmt                     |
| `pnpm knip`         | Find unused files and dependencies              |
| `pnpm test`         | Unit and component tests with Vitest            |
| `pnpm test:e2e`     | Build, then run the Playwright end-to-end tests |

## Project structure

```
app/            pages, components and the quiz composable
i18n/locales/   English and German messages
server/api/     the three endpoints
server/utils/   GitHub storage and request validation
shared/         quiz and statistics logic, constants, questions
results/        one JSON file per device (in the GitHub repository)
test/           unit, component and end-to-end tests
```

## License

Licensed under the MIT license, Copyright © trueberryless.

See [LICENSE](https://github.com/trueberryless/correlation-vs-causation-quiz/blob/main/LICENSE) for more information.
