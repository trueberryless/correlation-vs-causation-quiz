# Correlation vs Causation Quiz

An interactive quiz to test your ability to distinguish between correlation and causation.

## Features

- 🌐 Bilingual support (English & German) with i18next
- 🎯 10 random questions (5 true, 5 false)
- 📊 Confidence ratings for each answer (50-100%)
- 🔄 Up to 3 attempts per user
- 📈 Global statistics dashboard
- 🔒 Secure server-side GitHub API integration
- 💾 Local storage backup
- ✨ Beautiful gradient UI with smooth animations
- 📚 Educational content explaining correlation vs causation

## Setup

1. Clone the repository
2. Install dependencies:
```bash
   npm install
```

3. Create a `results/` folder in your GitHub repository

4. Create a `.env` file with your GitHub token:
```
   GITHUB_TOKEN=your_github_personal_access_token
   PUBLIC_REPO_OWNER=trueberryless
   PUBLIC_REPO_NAME=correlation-vs-causation-quiz
```

5. Run development server:
```bash
   npm run dev
```

6. Build for production:
```bash
   npm run build
```

## GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these scopes:
   - `repo` (Full control of repositories)
3. Add token to `.env` file (server-side only - NOT committed to git)

## Security

- ✅ GitHub token is stored server-side only
- ✅ Client never has access to authentication credentials
- ✅ All GitHub API calls go through secure server endpoints
- ✅ Input validation on all API endpoints

## How It Works

1. Users get 10 random questions (5 causal, 5 correlation)
2. **NEW:** Users must adjust confidence slider (50-100%) before answering
3. After all questions, they estimate total correct answers
4. Results are saved locally AND submitted via secure API
5. Each device gets a unique anonymous ID
6. Multiple attempts from same device are stored in one file
7. Statistics page aggregates all results anonymously

## Project Structure
```
├── src/
│   ├── components/
│   │   ├── Quiz.jsx
│   │   ├── Statistics.jsx
│   │   └── LanguageSwitcher.jsx
│   ├── data/
│   │   └── questions.json
│   ├── i18n/
│   │   ├── en.json
│   │   └── de.json
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── stats.astro
│   │   └── api/
│   │       ├── submit-results.ts
│   │       └── get-stats.ts
│   ├── utils/
│   │   └── i18n.js
│   └── constants.ts
├── results/          (in GitHub repo)
│   ├── .gitkeep
│   └── {userId}.json (one file per device)
└── README.md
```

## Constants

- `MAX_ATTEMPTS = 3` - Maximum quiz attempts per device
- `MIN_CONFIDENCE = 50` - Minimum confidence level
- `MAX_CONFIDENCE = 100` - Maximum confidence level

## License

MIT
