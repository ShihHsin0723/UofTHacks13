import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "./Layout";

const API_URL = "http://localhost:3000";

const Journal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Get date from URL params or use today's date
  const dateParam = searchParams.get("date");
  const journalDate = dateParam ? new Date(dateParam) : new Date();
  
  // Format date for display
  const formattedDate = journalDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format date for API (ISO string)
  const dateForAPI = journalDate.toISOString();

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please enter some content before saving.");
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to save journal entries.");
        navigate("/");
        return;
      }

      const response = await fetch(`${API_URL}/journal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: dateForAPI,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save journal entry");
        setLoading(false);
        return;
      }

      setLoading(false);
      
      // Show AI response if available
      if (data.aiResponse) {
        setSuccess(true);
        setIsLoadingAi(true);
        // Simulate a brief delay for dramatic effect
        setTimeout(() => {
          setAiResponse(data.aiResponse);
          setIsLoadingAi(false);
          setShowAiResponse(true);
          setSuccess(false); // Hide success message when AI response shows
        }, 800);
      } else {
        // Redirect to dashboard if no AI response
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold" style={{ color: "#374151" }}>
              Journal Entry
            </h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg hover:bg-white/50 transition-all duration-200"
              style={{ color: "#374151" }}
            >
              Go Back
            </button>
          </div>

          <div className="mb-4">
            <p className="text-lg" style={{ color: "#6B7280" }}>
              {formattedDate}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && !showAiResponse && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {isLoadingAi ? "Journal entry saved! Getting AI response..." : "Journal entry saved successfully! Redirecting..."}
            </div>
          )}

          {/* Text Editor */}
          <div className="mb-6" style={{ position: "relative" }}>
            <div
              className="rounded-lg shadow-2xl p-8"
              style={{
                background: "#F5F1EB",
                backgroundImage: `
                  repeating-linear-gradient(
                    transparent,
                    transparent 31px,
                    rgba(155, 171, 190, 0.1) 31px,
                    rgba(155, 171, 190, 0.1) 32px
                  )
                `,
                border: "1px solid rgba(155, 171, 190, 0.2)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
              }}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dear Journal..."
                className="w-full h-96 bg-transparent border-none focus:outline-none resize-none"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: "18px",
                  lineHeight: "32px",
                  color: "#2D3748",
                  letterSpacing: "0.3px",
                  padding: "0",
                  background: "transparent",
                }}
              />
            </div>
          </div>

          {/* Save Button - Send Icon */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleSave}
              disabled={loading || success || isLoadingAi}
              className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              style={{
                background: loading || isLoadingAi ? "#D9C8BF" : "#EBE2DD",
                color: "#1F2937",
              }}
            >
              {loading || isLoadingAi ? (
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Loading Dots Overlay */}
          {(loading || isLoadingAi) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <div
                    className="w-3 h-3 rounded-full animate-bounce"
                    style={{
                      background: "#9BABBE",
                      animationDelay: "0ms",
                      animationDuration: "1s",
                    }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full animate-bounce"
                    style={{
                      background: "#9BABBE",
                      animationDelay: "200ms",
                      animationDuration: "1s",
                    }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full animate-bounce"
                    style={{
                      background: "#9BABBE",
                      animationDelay: "400ms",
                      animationDuration: "1s",
                    }}
                  ></div>
                </div>
                <p className="text-sm" style={{ color: "#9BABBE" }}>
                  {loading ? "Saving your thoughts..." : "AI companion is thinking..."}
                </p>
              </div>
            </div>
          )}

          {/* AI Response Section */}
          {showAiResponse && aiResponse && (
            <div className="mt-8 animate-fade-in">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(155, 171, 190, 0.3), transparent)" }}></div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md" style={{ background: "#9BABBE" }}>
                    <svg
                      className="w-6 h-6"
                      fill="white"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="4" y="6" width="16" height="12" rx="2" fill="white"/>
                      <circle cx="9" cy="11" r="1.5" fill="#9BABBE"/>
                      <circle cx="15" cy="11" r="1.5" fill="#9BABBE"/>
                      <rect x="8" y="14" width="8" height="2" rx="1" fill="#9BABBE"/>
                      <rect x="6" y="4" width="3" height="2" rx="1" fill="white"/>
                      <rect x="15" y="4" width="3" height="2" rx="1" fill="white"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#9BABBE" }}>
                    AI Companion
                  </p>
                </div>
                <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(155, 171, 190, 0.3), transparent)" }}></div>
              </div>
              
              <div
                className="rounded-lg shadow-xl p-8 relative transform transition-all duration-500"
                style={{
                  background: "#F9F7F4",
                  border: "1px solid rgba(155, 171, 190, 0.2)",
                  boxShadow: "0 15px 50px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
                }}
              >
                <div
                  className="text-lg leading-relaxed"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    color: "#2D3748",
                    letterSpacing: "0.2px",
                    lineHeight: "1.8",
                  }}
                >
                  {aiResponse}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  style={{
                    background: "#EBE2DD",
                    color: "#1F2937",
                  }}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Journal;

