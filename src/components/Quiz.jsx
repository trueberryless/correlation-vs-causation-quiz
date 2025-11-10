import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  Globe,
  Lightbulb,
  Info,
} from "lucide-react";
import { nanoid } from "nanoid";
import questionsData from "../data/questions.json";
import { MAX_ATTEMPTS, MIN_CONFIDENCE, MAX_CONFIDENCE } from "../constants";

const Quiz = () => {
  const { t, i18n } = useTranslation();
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [confidence, setConfidence] = useState(MIN_CONFIDENCE);
  const [hasAdjustedSlider, setHasAdjustedSlider] = useState(false);
  const [totalEstimate, setTotalEstimate] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSliderHint, setShowSliderHint] = useState(false);

  useEffect(() => {
    // Get or create user ID (hardware-specific, persists across attempts)
    let id = localStorage.getItem("quizUserId");
    if (!id) {
      id = nanoid();
      localStorage.setItem("quizUserId", id);
    }
    setUserId(id);

    // Load attempts
    const attempts = parseInt(
      localStorage.getItem("quizAttempts") || String(MAX_ATTEMPTS),
    );
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

  const handleSliderChange = (value) => {
    setConfidence(value);
    setHasAdjustedSlider(true);
    setShowSliderHint(false);
  };

  const handleAnswer = (isCausal) => {
    if (!hasAdjustedSlider) {
      setShowSliderHint(true);
      return;
    }

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
    setConfidence(MIN_CONFIDENCE);
    setHasAdjustedSlider(false);
    setShowSliderHint(false);

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

    const quizResult = {
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

    setResults(quizResult);

    // Save to localStorage
    const userResults = JSON.parse(
      localStorage.getItem(`quizResults_${userId}`) || "[]",
    );
    userResults.push(quizResult);
    localStorage.setItem(`quizResults_${userId}`, JSON.stringify(userResults));

    // Update attempts
    const newAttempts = attemptsLeft - 1;
    setAttemptsLeft(newAttempts);
    localStorage.setItem("quizAttempts", newAttempts.toString());

    // Submit to server
    try {
      const response = await fetch("/api/submit-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          results: [quizResult],
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.warn("Failed to submit to GitHub:", data.error);
      }
    } catch (error) {
      console.error("Error submitting to server:", error);
    }

    setIsSubmitting(false);
    setStep("results");
  };

  const resetQuiz = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers([]);
    setConfidence(MIN_CONFIDENCE);
    setHasAdjustedSlider(false);
    setShowSliderHint(false);
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

            {/* Educational Section */}
            <div
              className="bg-blue-800/40 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 shadow-2xl animate-fade-in text-left"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-start gap-4">
                <Lightbulb className="w-10 h-10 text-yellow-400 flex-shrink-0 mt-1" />
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-200">
                    {t("whatIsTheDifference")}
                  </h3>
                  <p className="text-lg leading-relaxed text-blue-100">
                    {t("correlationExplanation")}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                      <h4 className="font-bold text-red-200 mb-2 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        {t("correlationTitle")}
                      </h4>
                      <p className="text-sm text-red-100">
                        {t("correlationExample")}
                      </p>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                      <h4 className="font-bold text-green-200 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        {t("causalityTitle")}
                      </h4>
                      <p className="text-sm text-green-100">
                        {t("causalityExample")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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

              {/* Confidence Slider - MOVED BEFORE BUTTONS */}
              <div className="mb-8 space-y-6 bg-purple-900/40 rounded-2xl p-6 border-2 border-purple-500/50">
                <div className="flex items-center gap-3">
                  <Info className="w-6 h-6 text-purple-300" />
                  <label className="block text-xl font-semibold">
                    {t("confidenceQuestion")}
                  </label>
                </div>
                <input
                  type="range"
                  min={MIN_CONFIDENCE}
                  max={MAX_CONFIDENCE}
                  value={confidence}
                  onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                  className="w-full h-4 bg-purple-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center">
                  <div
                    className={`text-5xl font-bold transition-all ${hasAdjustedSlider ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400" : "text-purple-500"}`}
                  >
                    {confidence}%
                  </div>
                  {!hasAdjustedSlider && (
                    <p className="text-purple-300 mt-2 animate-pulse">
                      {t("adjustSliderFirst")}
                    </p>
                  )}
                </div>
              </div>

              {showSliderHint && (
                <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-400 animate-bounce" />
                    <p className="text-yellow-100 font-semibold">
                      {t("pleaseAdjustSlider")}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="text-6xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-green-300 to-green-100">
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
                <div className="text-6xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-100">
                  {results.avgConfidence.toFixed(1)}%
                </div>
                <div className="text-2xl font-semibold">
                  {t("averageConfidence")}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/40 to-purple-700/40 backdrop-blur-lg rounded-3xl p-10 border border-purple-500/30 shadow-2xl hover:scale-105 transition-transform">
                {" "}
                <Globe className="w-20 h-20 mx-auto mb-6 animate-pulse" />
                <div className="text-6xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-purple-300 to-purple-100">
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
