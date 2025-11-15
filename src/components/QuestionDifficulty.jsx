import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Filter,
  BarChart3,
} from "lucide-react";

const QuestionDifficulty = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'causal', 'correlation'
  const [sortBy, setSortBy] = useState("difficulty"); // 'difficulty', 'attempts', 'confidence'

  useEffect(() => {
    loadDifficultyData();
  }, []);

  const loadDifficultyData = async () => {
    try {
      const response = await fetch("/api/question-difficulty");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading difficulty data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats.filter((stat) => {
    if (filter === "causal") return stat.question.is_causal === true;
    if (filter === "correlation") return stat.question.is_causal === false;
    return true;
  });

  const sortedStats = [...filteredStats].sort((a, b) => {
    switch (sortBy) {
      case "difficulty":
        // Use confidence-weighted difficulty for smart sorting
        return b.confidenceWeightedDifficulty - a.confidenceWeightedDifficulty;
      case "attempts":
        return b.totalAttempts - a.totalAttempts;
      case "confidence":
        return b.avgConfidence - a.avgConfidence;
      default:
        return b.confidenceWeightedDifficulty - a.confidenceWeightedDifficulty;
    }
  });

  const getDifficultyColor = (score) => {
    // Adjust thresholds for confidence-weighted scores
    if (score >= 60) return "text-red-400 bg-red-500/20 border-red-500/30";
    if (score >= 40)
      return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    if (score >= 20)
      return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    return "text-green-400 bg-green-500/20 border-green-500/30";
  };

  const getDifficultyLabel = (score) => {
    if (score >= 60) return t("veryHard");
    if (score >= 40) return t("hard");
    if (score >= 20) return t("medium");
    return t("easy");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-16 py-12 max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
            {t("questionDifficulty")}
          </h1>
          <p className="text-2xl text-purple-200">
            {t("questionDifficultySubtitle")}
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-purple-800/40 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-purple-500/30 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t("filterByType")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    filter === "all"
                      ? "bg-purple-600 text-white shadow-lg scale-105"
                      : "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                  }`}
                >
                  {t("all")}
                </button>
                <button
                  onClick={() => setFilter("causal")}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    filter === "causal"
                      ? "bg-green-600 text-white shadow-lg scale-105"
                      : "bg-green-900/30 text-green-300 hover:bg-green-800/50"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {t("causalOnly")}
                </button>
                <button
                  onClick={() => setFilter("correlation")}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    filter === "correlation"
                      ? "bg-red-600 text-white shadow-lg scale-105"
                      : "bg-red-900/30 text-red-300 hover:bg-red-800/50"
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  {t("correlationOnly")}
                </button>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t("sortBy")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("difficulty")}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    sortBy === "difficulty"
                      ? "bg-purple-600 text-white shadow-lg scale-105"
                      : "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                  }`}
                >
                  {t("difficulty")}
                </button>
                <button
                  onClick={() => setSortBy("attempts")}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    sortBy === "attempts"
                      ? "bg-purple-600 text-white shadow-lg scale-105"
                      : "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                  }`}
                >
                  {t("attempts")}
                </button>
                <button
                  onClick={() => setSortBy("confidence")}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    sortBy === "confidence"
                      ? "bg-purple-600 text-white shadow-lg scale-105"
                      : "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                  }`}
                >
                  {t("confidence")}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-purple-500/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-300">
                  {sortedStats.length}
                </div>
                <div className="text-sm text-purple-400">
                  {t("totalQuestions")}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-300">
                  {sortedStats.filter((s) => s.question.is_causal).length}
                </div>
                <div className="text-sm text-green-400">{t("causal")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-300">
                  {sortedStats.filter((s) => !s.question.is_causal).length}
                </div>
                <div className="text-sm text-red-400">{t("correlation")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-300">
                  {sortedStats.reduce((sum, s) => sum + s.totalAttempts, 0)}
                </div>
                <div className="text-sm text-yellow-400">
                  {t("totalAttempts")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {sortedStats.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-purple-400 opacity-50" />
            <p className="text-2xl text-purple-300">{t("noDataYet")}</p>
            <p className="text-lg text-purple-400 mt-2">
              {t("completeQuizFirst")}
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {sortedStats.map((stat, index) => (
              <div
                key={stat.questionId}
                className="bg-purple-800/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 shadow-xl hover:scale-[1.02] transition-transform"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        index < 3
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg"
                          : "bg-purple-900/50 text-purple-300"
                      }`}
                    >
                      {index < 3 ? (
                        <Award className="w-8 h-8" />
                      ) : (
                        `#${index + 1}`
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          stat.question.is_causal
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {stat.question.is_causal ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {t("causal")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {t("correlation")}
                          </span>
                        )}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold border ${getDifficultyColor(stat.confidenceWeightedDifficulty)}`}
                      >
                        {getDifficultyLabel(stat.confidenceWeightedDifficulty)}
                      </span>

                      <span className="text-sm text-purple-400">
                        ID: {stat.questionId}
                      </span>
                    </div>

                    {/* Statement */}
                    <h3 className="text-xl font-bold text-white leading-relaxed">
                      {stat.question.statement[i18n.language]}
                    </h3>

                    {/* Explanation */}
                    <p className="text-purple-200 leading-relaxed">
                      {stat.question.explanation[i18n.language]}
                    </p>

                    {/* Source Link */}
                    {stat.question.source_url && (
                      <a
                        href={stat.question.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t("viewSource")}
                      </a>
                    )}

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-purple-500/30">
                      <div>
                        <div className="text-2xl font-bold text-purple-300">
                          {stat.confidenceWeightedDifficulty.toFixed(1)}
                        </div>
                        <div className="text-sm text-purple-400 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {t("difficulty")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-300">
                          {stat.difficultyScore.toFixed(1)}%
                        </div>
                        <div className="text-sm text-purple-400 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {t("errorRate")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-300">
                          {stat.accuracyRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-purple-400 flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          {t("accuracy")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-300">
                          {stat.totalAttempts}
                        </div>
                        <div className="text-sm text-purple-400">
                          {t("attempts")}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-300">
                          {stat.avgConfidence.toFixed(1)}%
                        </div>
                        <div className="text-sm text-purple-400">
                          {t("avgConfidence")}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400">
                        ✓ {stat.correctAttempts} {t("correct")}
                      </span>
                      <span className="text-red-400">
                        ✗ {stat.incorrectAttempts} {t("incorrect")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transform transition-all shadow-xl"
          >
            {t("backToQuiz")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default QuestionDifficulty;
