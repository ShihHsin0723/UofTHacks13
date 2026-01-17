import { useState } from "react";
import vinylImg from "../assets/vinyl.png";
import Layout from "./Layout";

const Chatbot = () => {
  const [reflection, setReflection] = useState(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [musicUrl, setMusicUrl] = useState(null);
  const [audioKey, setAudioKey] = useState(0);

  const API_URL = "http://localhost:3000";

  const orbitStyles = `
    @keyframes slow-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  const getWeekStartIso = () => {
    const today = new Date();
    const utc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const day = utc.getUTCDay();
    const diff = (day + 6) % 7;
    utc.setUTCDate(utc.getUTCDate() - diff + weekOffset * 7);
    utc.setUTCHours(0, 0, 0, 0);
    return utc.toISOString();
  };

  const handleGenerateReflection = async () => {
    setError("");
    setLoadingReflection(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view your weekly reflection.");
        setLoadingReflection(false);
        return;
      }

      const weekStartIso = getWeekStartIso();
      const res = await fetch(
        `${API_URL}/weekly-reflection?weekStart=${encodeURIComponent(weekStartIso)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Unable to fetch weekly reflection.");
      const resolvedMusicUrl = data.musicUrl
        ? `${API_URL}${data.musicUrl}`
        : null;
      setMusicUrl(resolvedMusicUrl);
      setAudioKey((prev) => prev + 1);
      setReflection(data);
    } catch (err) {
      setError(err.message || "Unable to fetch weekly reflection.");
    } finally {
      setLoadingReflection(false);
    }
  };

  return (
    <Layout>
      <style>{orbitStyles}</style>
      <div className="h-full w-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6b7287]">
                Weekly Mood
              </p>
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl md:text-5xl font-bold text-[#1f2a3a]">
                  Weekly Analytics
                </h1>
                <p className="text-base text-[#4b5161] max-w-xl">
                  Spin up your week&apos;s highlights and soundtrack.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                id="week-select"
                value={weekOffset}
                onChange={(e) => setWeekOffset(parseInt(e.target.value, 10))}
                className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9BABBE]"
              >
                <option value={0}>This Week</option>
                <option value={-1}>Last Week</option>
                <option value={-2}>2 Weeks Ago</option>
                <option value={-3}>3 Weeks Ago</option>
              </select>
              <button
                type="button"
                onClick={handleGenerateReflection}
                disabled={loadingReflection}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 shadow-[0_0_14px_rgba(31,42,58,0.25)]"
                style={{
                  background: `linear-gradient(135deg, #4B5563 0%, #1F2937 100%)`,
                }}
              >
                {loadingReflection ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>

          {error && (
            <div className="w-full p-3 rounded bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {reflection ? (
            <div className="flex flex-col items-center gap-8">
              <div
                className="relative"
                style={{ width: "540px", height: "540px" }}
              >
                {/* Vinyl Centerpiece */}
                <div
                  className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    width: "174px",
                    height: "174px",
                    animation: "slow-spin 12s linear infinite",
                  }}
                >
                  <img
                    src={vinylImg}
                    alt="Vinyl"
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>

                {/* Reflection Nodes */}
                {[
                  {
                    label: "Themes",
                    items: reflection.themes || [],
                    color: "#374151",
                    bg: "#E5E7EB",
                    pos: { top: "17%", left: "50%" },
                  },
                  {
                    label: "Growth",
                    items: reflection.growthMoments || [],
                    color: "#1E40AF",
                    bg: "#DBEAFE",
                    pos: { top: "50%", left: "83%" },
                  },
                  {
                    label: "Challenge",
                    items: [reflection.challenge || "No data"],
                    color: "#991B1B",
                    bg: "#FEE2E2",
                    pos: { top: "83%", left: "50%" },
                  },
                  {
                    label: "Improvement",
                    items: [reflection.improvement || "No data"],
                    color: "#5B21B6",
                    bg: "#EDE9FE",
                    pos: { top: "50%", left: "17%" },
                  },
                ].map((section) => (
                  <div
                    key={section.label}
                    className="absolute"
                    style={{
                      top: section.pos.top,
                      left: section.pos.left,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div
                      className="w-[146px] h-[146px] rounded-full shadow-lg border-4 border-white flex flex-col items-center justify-center p-4 text-center transition-transform hover:scale-105"
                      style={{ backgroundColor: section.bg }}
                    >
                      <div
                        className="text-[10px] font-black uppercase tracking-widest mb-1"
                        style={{ color: section.color }}
                      >
                        {section.label}
                      </div>
                      <div className="text-[11px] text-gray-700 font-semibold leading-tight line-clamp-3">
                        {section.items.length > 0
                          ? section.items[0]
                          : "Nothing recorded"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center max-w-2xl">
                <h3 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-3">
                  Identity of the Week
                </h3>
                <p className="text-sm font-bold text-gray-800 italic">
                  "{reflection.identity || "Discovering..."}"
                </p>
                {musicUrl && (
                  <audio
                    key={audioKey}
                    src={musicUrl}
                    autoPlay
                    loop
                    className="hidden"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 italic py-10">
              Click generate to view your unified reflection.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chatbot;
