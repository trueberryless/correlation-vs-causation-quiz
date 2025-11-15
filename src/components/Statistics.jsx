import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Users, TrendingUp, Award, ArrowLeft } from "lucide-react";

const Statistics = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Fetch from server API
      const response = await fetch("/api/get-stats");

      if (response.ok) {
        const data = await response.json();
        calculateStats(data);
      } else {
        // Fallback to localStorage
        const userId = localStorage.getItem("quizUserId");
        const localData = JSON.parse(
          localStorage.getItem(`quizResults_${userId}`) || "[]",
        );
        calculateStats(localData);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      // Fallback to localStorage
      const userId = localStorage.getItem("quizUserId");
      const localData = JSON.parse(
        localStorage.getItem(`quizResults_${userId}`) || "[]",
      );
      calculateStats(localData);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({
        totalParticipants: 0,
        totalAttempts: 0,
        averageScore: 0,
        averageConfidence: 0,
        scoreDistribution: Array(11).fill(0),
      });
      return;
    }

    // Count unique users (if we have userId field) or just count attempts
    const totalAttempts = data.length;
    const totalScore = data.reduce((sum, r) => sum + r.percentage, 0);
    const totalConfidence = data.reduce((sum, r) => sum + r.avgConfidence, 0);

    const scoreDistribution = Array(11).fill(0);
    data.forEach((r) => {
      const scoreIndex = r.correct; // 0-10
      scoreDistribution[scoreIndex]++;
    });

    setStats({
      totalParticipants: totalAttempts, // In reality this is attempts, not unique users
      totalAttempts,
      averageScore: totalScore / totalAttempts,
      averageConfidence: totalConfidence / totalAttempts,
      scoreDistribution,
    });
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

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("backToQuiz")}
          </a>
        </div>

        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
            {t("statistics")}
          </h1>
          <p className="text-2xl text-purple-200">{t("globalResults")}</p>
        </div>

        {stats && stats.totalAttempts > 0 ? (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-600/40 to-purple-700/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
                <Users className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                <div className="text-5xl font-bold mb-2">
                  {stats.totalAttempts}
                </div>
                <div className="text-xl text-purple-200">
                  {t("totalAttempts")}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600/40 to-green-700/40 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30 shadow-2xl">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-green-300" />
                <div className="text-5xl font-bold mb-2">
                  {stats.averageScore.toFixed(1)}%
                </div>
                <div className="text-xl text-green-200">
                  {t("averageScore")}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600/40 to-blue-700/40 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30 shadow-2xl">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                <div className="text-5xl font-bold mb-2">
                  {stats.averageConfidence.toFixed(1)}%
                </div>
                <div className="text-xl text-blue-200">
                  {t("averageConfidence")}
                </div>
              </div>
            </div>

            <div className="bg-purple-800/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30 shadow-2xl">
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Award className="w-8 h-8" />
                {t("scoreDistribution")}
              </h2>

              <div className="space-y-3">
                {stats.scoreDistribution.map((count, score) => {
                  const percentage =
                    stats.totalAttempts > 0
                      ? (count / stats.totalAttempts) * 100
                      : 0;

                  return (
                    <div key={score} className="flex items-center gap-4">
                      <div className="w-20 text-right font-semibold">
                        {score}/10
                      </div>
                      <div className="flex-1 bg-purple-900/50 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                          style={{ width: `${percentage}%` }}
                        >
                          {count > 0 && (
                            <span className="text-sm font-bold">{count}</span>
                          )}
                        </div>
                      </div>
                      <div className="w-16 text-purple-300">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <BarChart3 className="w-24 h-24 mx-auto mb-6 text-purple-400 opacity-50" />
            <p className="text-2xl text-purple-300">No data available yet</p>
            <p className="text-lg text-purple-400 mt-2">
              Be the first to complete the quiz!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
