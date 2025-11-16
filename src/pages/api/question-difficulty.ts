import type { APIRoute } from "astro";
import questionsData from "../../data/questions.json";

interface Answer {
  questionId: number;
  confidence: number;
  correct: boolean;
}

interface QuizResult {
  timestamp: string;
  correct: number;
  total: number;
  percentage: number;
  avgConfidence: number;
  estimate: number;
  answers: Answer[];
}

interface QuestionStats {
  questionId: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracyRate: number;
  difficultyScore: number;
  confidenceWeightedDifficulty: number;
  avgConfidence: number;
  question: (typeof questionsData)[0];
}

export const GET: APIRoute = async () => {
  try {
    const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
    const REPO_OWNER = import.meta.env.PUBLIC_REPO_OWNER || "trueberryless";
    const REPO_NAME =
      import.meta.env.PUBLIC_REPO_NAME || "correlation-vs-causation-quiz";

    let allResults: QuizResult[] = [];

    if (GITHUB_TOKEN) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/results`,
          {
            headers: {
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );

        if (response.ok) {
          const files = await response.json();
          for (const file of files) {
            if (file.type === "file" && file.name.endsWith(".json")) {
              try {
                const fileResponse = await fetch(file.download_url);
                if (fileResponse.ok) {
                  const data = await fileResponse.json();
                  allResults.push(...data);
                }
              } catch (error) {
                console.error(`Error fetching ${file.name}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error("GitHub fetch error:", error);
      }
    }

    // Calculate statistics for each question
    const questionStatsMap = new Map<number, QuestionStats>();

    // Initialize stats for all questions
    questionsData.forEach((question) => {
      questionStatsMap.set(question.id, {
        questionId: question.id,
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        accuracyRate: 0,
        difficultyScore: 0,
        confidenceWeightedDifficulty: 0,
        avgConfidence: 0,
        question: question,
      });
    });

    // Aggregate data from all quiz results
    let totalConfidenceByQuestion = new Map<number, number[]>();

    allResults.forEach((result) => {
      result.answers.forEach((answer) => {
        const stats = questionStatsMap.get(answer.questionId);
        // Obsolete questions can not be found anymore (deleted)
        if (stats) {
          stats.totalAttempts++;
          if (answer.correct) {
            stats.correctAttempts++;
          } else {
            stats.incorrectAttempts++;
          }

          // Track confidence levels
          if (!totalConfidenceByQuestion.has(answer.questionId)) {
            totalConfidenceByQuestion.set(answer.questionId, []);
          }
          totalConfidenceByQuestion
            .get(answer.questionId)!
            .push(answer.confidence);
        }
      });
    });

    // Find max attempts for normalization
    const maxAttempts = Math.max(
      ...Array.from(questionStatsMap.values()).map((s) => s.totalAttempts),
      1,
    );

    // Calculate accuracy and difficulty scores with confidence weighting
    const statsArray: QuestionStats[] = [];
    questionStatsMap.forEach((stats) => {
      if (stats.totalAttempts > 0) {
        // Basic accuracy rate
        stats.accuracyRate =
          (stats.correctAttempts / stats.totalAttempts) * 100;

        // Basic difficulty score (error rate)
        const errorRate = 100 - stats.accuracyRate;

        // Wilson Score confidence interval for reliability
        // This gives more weight to questions with more attempts
        const n = stats.totalAttempts;
        const p = stats.incorrectAttempts / n; // Error proportion

        // Confidence factor: questions with more attempts get higher confidence
        // Using a sigmoid-like function to gradually increase confidence
        const minAttempts = 5; // Consider questions with 5+ attempts as reliable
        const confidenceFactor = Math.min(1, n / minAttempts);

        // Weighted difficulty score that considers:
        // 1. Error rate (how many got it wrong)
        // 2. Sample size (how many attempts)
        // 3. Confidence weighting (more attempts = more reliable)

        // Method 1: Simple confidence weighting
        const simpleWeighted = errorRate * confidenceFactor;

        // Method 2: Bayesian average approach
        // Assume a prior of 50% difficulty (neutral) with weight of 3 attempts
        const priorWeight = 3;
        const priorDifficulty = 50;
        const bayesianDifficulty =
          (errorRate * n + priorDifficulty * priorWeight) / (n + priorWeight);

        // Method 3: Combined score that prioritizes high-attempt questions
        // Score = error_rate * (1 - e^(-attempts/10)) * (1 + log(1 + attempts))
        const exponentialWeight = 1 - Math.exp(-n / 10);
        const logarithmicBoost = Math.log(1 + n);
        const advancedWeighted =
          errorRate * exponentialWeight * (1 + logarithmicBoost / 5);

        // Use the advanced weighted score as default
        stats.difficultyScore = errorRate;
        stats.confidenceWeightedDifficulty = advancedWeighted;

        // Calculate average confidence
        const confidences =
          totalConfidenceByQuestion.get(stats.questionId) || [];
        if (confidences.length > 0) {
          stats.avgConfidence =
            confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        }

        statsArray.push(stats);
      }
    });

    return new Response(JSON.stringify(statsArray), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
