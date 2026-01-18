import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "./Layout";

const API_URL = "http://localhost:3000";

const Journal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // NEW STATE: track if it's a past date with no content
  const [isPastWithoutEntry, setIsPastWithoutEntry] = useState(false);
  
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const dateParam = searchParams.get("date");
  const journalDate = dateParam ? new Date(dateParam) : new Date();
  
  const formattedDate = journalDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dateForAPI = journalDate.toISOString();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      setLoading(true);
      setIsPastWithoutEntry(false); // Reset state on new date fetch

      try {
        const entryResponse = await fetch(`${API_URL}/journal?date=${dateForAPI}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await entryResponse.json();

        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          setContent(entry.content);
          setAiResponse(entry.aiResponse || "");
          setIsReadOnly(true);
          setButtonClicked(true);
          if (entry.aiResponse) setShowAiResponse(true);
        } else {
          // CHECK FOR PAST DATE LOGIC
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkDate = new Date(journalDate);
          checkDate.setHours(0, 0, 0, 0);

          if (checkDate < today) {
            // It's in the past and no entry was found
            setIsPastWithoutEntry(true);
          } else {
            // It's today or future (but you likely handle future on dashboard)
            setContent("");
            setAiResponse("");
            setIsReadOnly(false);
            setButtonClicked(false);
            setShowAiResponse(false);

            setIsLoadingTopics(true);
            try {
              const topicsResponse = await fetch(`${API_URL}/topics`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const topicsData = await topicsResponse.json();
              setSuggestedTopics(topicsData.topics || []);
            } catch (topicErr) {
              console.error("Failed to fetch topics:", topicErr);
            } finally {
              setIsLoadingTopics(false);
            }
          }
        }
      } catch (err) {
        console.error("Error loading journal data:", err);
        setError("Failed to load journal information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateForAPI, navigate]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please enter some content before saving.");
      return;
    }

    setError("");
    setButtonClicked(true);
    setIsLoadingAi(true);

    try {
      const token = localStorage.getItem("token");
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
        setButtonClicked(false);
        setIsLoadingAi(false);
        return;
      }

      if (data.aiResponse) {
        setTimeout(() => {
          setAiResponse(data.aiResponse);
          setIsLoadingAi(false);
          setShowAiResponse(true);
          setIsReadOnly(true);
        }, 1200);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setButtonClicked(false);
      setIsLoadingAi(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-lg" style={{ color: "#9BABBE" }}>
            Gathering your thoughts...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 relative min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3" style={{ color: "#374151" }}>
              {formattedDate}
              {isReadOnly && (
                <span className="text-sm font-normal italic opacity-50 mt-2">
                  (Read Only)
                </span>
              )}
            </h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg hover:bg-white/50 transition-all duration-200"
              style={{ color: "#374151" }}
            >
              Go Back
            </button>
          </div>

          {/* NEW: Conditional message for past dates without entries */}
          {isPastWithoutEntry ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white/30 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">No entry found</h2>
              <p className="text-gray-500">You didn't write anything in your journal on this date.</p>
            </div>
          ) : (
            <>
              {/* AI Suggested Topics Section */}
              {!isReadOnly && suggestedTopics.length > 0 && (
                <div className="mb-6 animate-fade-in">
                  <div 
                    className="rounded-xl p-6 border"
                    style={{
                      background: "rgba(255, 255, 255, 0.4)",
                      borderColor: "rgba(155, 171, 190, 0.2)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#9BABBE" strokeWidth="2">
                        <path d="M12 3L14.5 9L21 11.5L14.5 14L12 20L9.5 14L3 11.5L9.5 9L12 3Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-bold tracking-wide uppercase" style={{ color: "#9BABBE", fontSize: "11px" }}>
                        AI Topic Suggestions
                      </span>
                    </div>

                    <div className="space-y-3">
                      {suggestedTopics.map((topic, i) => (
                        <div
                          key={i}
                          className="pl-4 border-l-2"
                          style={{ borderColor: "rgba(155, 171, 190, 0.3)" }}
                        >
                          <p className="text-sm leading-relaxed italic" style={{ color: "#4A5568" }}>
                            {topic}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Main Text Editor */}
              <div className="mb-6" style={{ position: "relative" }}>
                <div
                  className="journal-scroll-container rounded-lg shadow-2xl p-8 transition-colors duration-500"
                  style={{
                    background: isReadOnly ? "#F9F7F4" : "#F5F1EB",
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
                    placeholder="Write your thoughts here, and your AI companion will reflect with you..."
                    disabled={isReadOnly || buttonClicked || isLoadingAi}
                    className="w-full h-96 bg-transparent border-none focus:outline-none resize-none"
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: "18px",
                      lineHeight: "32px",
                      color: isReadOnly ? "#4A5568" : "#2D3748",
                      letterSpacing: "0.3px",
                      padding: "0",
                    }}
                  />
                </div>
              </div>

              {/* Save Button */}
              {!isReadOnly && !buttonClicked && (
                <div className="flex justify-end mb-6">
                  <button
                    onClick={handleSave}
                    disabled={isLoadingAi}
                    className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
                    style={{
                      background: "#EBE2DD",
                      color: "#1F2937",
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              )}

              {/* AI Companion Section */}
              {showAiResponse && aiResponse && (
                <div className="mt-12 animate-fade-in pb-12">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl" style={{ background: "#9BABBE" }}>
                        <svg className="w-12 h-12" fill="white" viewBox="0 0 24 24">
                          <rect x="4" y="6" width="16" height="12" rx="2" fill="white"/>
                          <circle cx="9" cy="11" r="1.5" fill="#9BABBE"/>
                          <circle cx="15" cy="11" r="1.5" fill="#9BABBE"/>
                          <rect x="8" y="14" width="8" height="2" rx="1" fill="#9BABBE"/>
                        </svg>
                      </div>
                    </div>

                    <div 
                      className="relative flex-1 rounded-3xl shadow-2xl p-6"
                      style={{
                        background: "#FFFFFF",
                        border: "2px solid rgba(155, 171, 190, 0.3)",
                        maxWidth: "700px",
                      }}
                    >
                      <div
                        className="text-base leading-relaxed"
                        style={{
                          fontFamily: "'Georgia', serif",
                          color: "#2D3748",
                          lineHeight: "1.8",
                        }}
                      >
                        {aiResponse}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Thinking State */}
              {isLoadingAi && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "200ms" }}></div>
                    <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "400ms" }}></div>
                  </div>
                  <p className="text-sm text-gray-500 italic">Your AI companion is reflecting...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Journal;