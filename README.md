# Correlation vs Causation Quiz

An interactive quiz to test your ability to distinguish between correlation and causation.

## Features

- 🌐 Bilingual support (English & German)
- 🎯 10 random questions (5 true, 5 false)
- 📊 Confidence ratings for each answer
- 🔄 Up to 3 attempts per user
- 📈 Global statistics dashboard
- 🤖 Automatic GitHub PR submission for results
- 💾 Local storage backup
- ✨ Beautiful gradient UI with animations

## Setup

1. Clone the repository
2. Install dependencies:
```bash
   npm install
```

3. Create a `.env` file with your GitHub token:
```
   PUBLIC_GITHUB_TOKEN=your_github_personal_access_token
```

4. Run development server:
```bash
   npm run dev
```

5. Build for production:
```bash
   npm run build
```

## GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Add token to `.env` file

## How It Works

1. Users get 10 random questions (5 causal, 5 correlation)
2. After each answer, they rate their confidence (50-100%)
3. After all questions, they estimate total correct answers
4. Results are saved locally AND submitted via GitHub PR
5. Statistics page shows anonymized aggregate data

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
│   │   └── stats.astro
│   └── utils/
│       └── i18n.js
├── results.json
└── README.md
```

## License

MIT
