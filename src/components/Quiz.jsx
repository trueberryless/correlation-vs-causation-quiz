import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  Globe,
} from "lucide-react";
import { nanoid } from "nanoid";
import questionsData from "../data/questions.json";

const Quiz = () => {
  const { t, i18n } = useTranslation();
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [confidence, setConfidence] = useState(50);
  const [totalEstimate, setTotalEstimate] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get or create user ID
    let id = localStorage.getItem("quizUserId");
    if (!id) {
      id = nanoid();
      localStorage.setItem("quizUserId", id);
    }
    setUserId(id);

    // Load attempts
    const attempts = parseInt(localStorage.getItem("quizAttempts") || "3");
    setAttemptsLeft(attempts);

    // Select questions
    selectQuestions();
  }, []);

  const selectQuestions = () => {
    const trueQuestions = questionsData.filter((q) => q.is_causal);
    const falseQuestions = questionsData.filter((q) => !q.is_causal);

    const selectedTrue = trueQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    const selectedFalse = falseQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    const allSelected = [...selectedTrue, ...selectedFalse].sort(
      () => 0.5 - Math.random(),
    );
    setQuestions(allSelected);
  };

  const handleAnswer = (isCausal) => {
    const question = questions[currentQ];
    const newAnswers = [
      ...answers,
      {
        questionId: question.id,
        answer: isCausal,
        confidence,
        correct: isCausal === question.is_causal,
        timestamp: new Date().toISOString(),
      },
    ];

    setAnswers(newAnswers);
    setConfidence(50);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("estimate");
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);

    const correct = answers.filter((a) => a.correct).length;
    const avgConf =
      answers.reduce((sum, a) => sum + a.confidence, 0) / answers.length;

    const quizResults = {
      userId,
      timestamp: new Date().toISOString(),
      correct,
      total: questions.length,
      percentage: (correct / questions.length) * 100,
      avgConfidence: avgConf,
      estimate: totalEstimate,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        confidence: a.confidence,
        correct: a.correct,
      })),
    };

    setResults(quizResults);

    // Save to localStorage
    const allResults = JSON.parse(localStorage.getItem("quizResults") || "[]");
    allResults.push(quizResults);
    localStorage.setItem("quizResults", JSON.stringify(allResults));

    // Update attempts
    const newAttempts = attemptsLeft - 1;
    setAttemptsLeft(newAttempts);
    localStorage.setItem("quizAttempts", newAttempts.toString());

    // Submit to GitHub
    try {
      await submitToGitHub(quizResults);
    } catch (error) {
      console.error("Error submitting to GitHub:", error);
    }

    setIsSubmitting(false);
    setStep("results");
  };

  const submitToGitHub = async (data) => {
    const GITHUB_TOKEN = import.meta.env.PUBLIC_GITHUB_TOKEN;
    const REPO_OWNER = "trueberryless";
    const REPO_NAME = "correlation-vs-causation-quiz";

    if (!GITHUB_TOKEN) {
      console.warn("No GitHub token found");
      return;
    }

    try {
      // Get current results file
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/results.json`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      let currentResults = [];
      let sha = null;

      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
        const content = atob(fileData.content);
        currentResults = JSON.parse(content);
      }

      // Add new result
      currentResults.push(data);

      // Create branch and PR
      const branchName = `quiz-result-${data.userId}-${Date.now()}`;

      // Get main branch SHA
      const mainBranch = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/main`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );
      const mainData = await mainBranch.json();
      const mainSha = mainData.object.sha;

      // Create new branch
      await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: mainSha,
          }),
        },
      );

      // Update file in new branch
      await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/results.json`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            message: `Add quiz result from user ${data.userId.slice(0, 8)}`,
            content: btoa(JSON.stringify(currentResults, null, 2)),
            sha: sha,
            branch: branchName,
          }),
        },
      );

      // Create PR
      await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            title: `Quiz Result: ${data.correct}/${data.total} correct (${data.percentage.toFixed(1)}%)`,
            body: `Automated quiz result submission\n\nScore: ${data.correct}/${data.total}\nConfidence: ${data.avgConfidence.toFixed(1)}%\nEstimate: ${data.estimate}`,
            head: branchName,
            base: "main",
          }),
        },
      );
    } catch (error) {
      console.error("GitHub submission error:", error);
      throw error;
    }
  };

  const resetQuiz = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers([]);
    setConfidence(50);
    setTotalEstimate(5);
    setResults(null);
    selectQuestions();
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {step === "intro" && (
          <div className="text-center space-y-8 animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 animate-slide-up">
              {t("title")}
            </h1>
            <p
              className="text-2xl md:text-3xl text-purple-200 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              {t("subtitle")}
            </p>

            <div
              className="bg-purple-800/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400 animate-pulse" />
              <p className="text-lg leading-relaxed">{t("note")}</p>
            </div>

            <button
              onClick={() => setStep("quiz")}
              disabled={attemptsLeft <= 0}
              className={`bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 px-12 py-5 rounded-full text-xl md:text-2xl font-bold hover:scale-110 transform transition-all duration-300 shadow-2xl hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in`}
              style={{ animationDelay: "0.6s" }}
            >
              {t("startQuiz")}
            </button>

            <p
              className="text-purple-300 text-lg animate-fade-in"
              style={{ animationDelay: "0.8s" }}
            >
              {attemptsLeft > 0
                ? t("attemptsLeft", { count: attemptsLeft })
                : t("noAttemptsLeft")}
            </p>

            <a
              href="/stats"
              className="inline-block text-purple-300 hover:text-white underline animate-fade-in"
              style={{ animationDelay: "1s" }}
            >
              {t("viewStatistics")}
            </a>
          </div>
        )}

        {step === "quiz" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <span className="text-xl font-medium">
                {t("questionProgress", {
                  current: currentQ + 1,
                  total: questions.length,
                })}
              </span>
              <div className="flex gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-3 rounded-full transition-all duration-300 ${
                      i < currentQ
                        ? "bg-green-400 shadow-lg shadow-green-400/50"
                        : i === currentQ
                          ? "bg-purple-400 shadow-lg shadow-purple-400/50 scale-110"
                          : "bg-purple-800/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-purple-800/40 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-purple-500/30 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-10 leading-tight">
                {questions[currentQ].statement[i18n.language]}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <button
                  onClick={() => handleAnswer(true)}
                  className="group bg-gradient-to-br from-green-600 to-green-700 p-8 rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 transform transition-all duration-300"
                >
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-xl font-bold mb-2">
                    {t("causalRelationship")}
                  </div>
                  <div className="text-sm text-green-200">
                    {t("trueStatement")}
                  </div>
                </button>

                <button
                  onClick={() => handleAnswer(false)}
                  className="group bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 transform transition-all duration-300"
                >
                  <XCircle className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-xl font-bold mb-2">
                    {t("justCorrelation")}
                  </div>
                  <div className="text-sm text-red-200">
                    {t("falseStatement")}
                  </div>
                </button>
              </div>

              <div className="space-y-6 bg-purple-900/40 rounded-2xl p-6">
                <label className="block text-xl font-semibold">
                  {t("confidenceQuestion")}
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full h-4 bg-purple-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center">
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                    {confidence}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "estimate" && (
          <div className="text-center space-y-10 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              {t("totalEstimateQuestion", { total: questions.length })}
            </h2>

            <div className="bg-purple-800/40 backdrop-blur-lg rounded-3xl p-12 border border-purple-500/30 shadow-2xl">
              <div className="flex justify-center items-center gap-6">
                <button
                  onClick={() =>
                    setTotalEstimate(Math.max(0, totalEstimate - 1))
                  }
                  className="w-16 h-16 bg-purple-700 hover:bg-purple-600 rounded-full text-3xl font-bold transition-all hover:scale-110"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={questions.length}
                  value={totalEstimate}
                  onChange={(e) =>
                    setTotalEstimate(
                      Math.max(
                        0,
                        Math.min(
                          questions.length,
                          parseInt(e.target.value) || 0,
                        ),
                      ),
                    )
                  }
                  className="w-32 h-32 text-7xl text-center bg-gradient-to-br from-purple-900 to-indigo-900 border-4 border-purple-500 rounded-2xl text-white font-bold shadow-2xl"
                />
                <button
                  onClick={() =>
                    setTotalEstimate(
                      Math.min(questions.length, totalEstimate + 1),
                    )
                  }
                  className="w-16 h-16 bg-purple-700 hover:bg-purple-600 rounded-full text-3xl font-bold transition-all hover:scale-110"
                >
                  +
                </button>
              </div>
              <div className="mt-6 text-purple-300 text-lg">
                out of {questions.length} questions
              </div>
            </div>

            <button
              onClick={submitQuiz}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 px-12 py-5 rounded-full text-2xl font-bold hover:scale-110 transform transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("submitting") : t("submitQuiz")}
            </button>
          </div>
        )}

        {step === "results" && results && (
          <div className="text-center space-y-10 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
              {t("yourResults")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-600/40 to-green-700/40 backdrop-blur-lg rounded-3xl p-10 border border-green-500/30 shadow-2xl hover:scale-105 transition-transform">
                <BarChart3 className="w-20 h-20 mx-auto mb-6 animate-pulse" />
                <div className="text-7xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-green-300 to-green-100">
                  {results.percentage.toFixed(1)}%
                </div>
                <div className="text-2xl font-semibold mb-2">
                  {t("correctAnswers")}
                </div>
                <div className="text-green-200 text-xl">
                  {results.correct} / {results.total}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600/40 to-blue-700/40 backdrop-blur-lg rounded-3xl p-10 border border-blue-500/30 shadow-2xl hover:scale-105 transition-transform">
                <TrendingUp className="w-20 h-20 mx-auto mb-6 animate-pulse" />
                <div className="text-7xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-100">
                  {results.avgConfidence.toFixed(1)}%
                </div>
                <div className="text-2xl font-semibold">
                  {t("averageConfidence")}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/40 to-purple-700/40 backdrop-blur-lg rounded-3xl p-10 border border-purple-500/30 shadow-2xl hover:scale-105 transition-transform">
                <Globe className="w-20 h-20 mx-auto mb-6 animate-pulse" />
                <div className="text-7xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-purple-300 to-purple-100">
                  {results.estimate}
                </div>
                <div className="text-2xl font-semibold mb-2">
                  {t("yourEstimate")}
                </div>
                <div className="text-purple-200 text-xl">
                  out of {results.total}
                </div>
              </div>
            </div>

            <div className="bg-purple-800/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
              <p className="text-xl text-green-400 font-semibold mb-2">
                {t("thankYou")}
              </p>
              <p className="text-purple-200">{t("dataSubmitted")}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {attemptsLeft > 0 && (
                <button
                  onClick={resetQuiz}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transform transition-all shadow-xl"
                >
                  {t("tryAgain", { count: attemptsLeft })}
                </button>
              )}

              <a
                href="/stats"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transform transition-all shadow-xl"
              >
                {t("viewStatistics")}
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.8), 0 0 40px rgba(168, 85, 247, 0.4);
          transition: all 0.3s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(236, 72, 153, 1), 0 0 60px rgba(168, 85, 247, 0.6);
        }
        .slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 20px rgba(236, 72, 153, 0.8), 0 0 40px rgba(168, 85, 247, 0.4);
          transition: all 0.3s;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(236, 72, 153, 1), 0 0 60px rgba(168, 85, 247, 0.6);
        }
      `}</style>
    </div>
  );
};

export default Quiz;
