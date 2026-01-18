import { useEffect, useRef, useState } from "react";
import vinylImg from "../assets/vinyl.png";
import Layout from "./Layout";

const Chatbot = () => {
  const [reflection, setReflection] = useState(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [musicUrl, setMusicUrl] = useState(null);
  const [audioKey, setAudioKey] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const API_URL = "http://localhost:3000";

  const orbitStyles = `
    @keyframes slow-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  const selectOptionStyles = `
    #week-select option {
      background: #1f2a3a;
      color: #EBE2DD;
    }
    #week-select option:checked {
      background: #2c3a54;
      color: #EBE2DD;
    }
  `;

  const weekOptions = [
    { value: 0, label: "This Week" },
    { value: -1, label: "Last Week" },
    { value: -2, label: "2 Weeks Ago" },
    { value: -3, label: "3 Weeks Ago" },
  ];

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);
  const handleSelect = (value) => {
    setWeekOffset(value);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <style>{selectOptionStyles}</style>
      <div className="h-full w-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
          <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6b7287]">
                Weekly Mood
              </p>
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl md:text-5xl font-bold text-[#1f2a3a]">
                  Weekly Analytics
                </h1>
                <p className="text-base mt-1 text-[#4b5161] max-w-2xl">
                  Discover your week&apos;s highlights and soundtrack.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={toggleDropdown}
                  className="w-44 flex items-center justify-between px-4 py-3 rounded-xl border border-[#2c3a54] bg-[#1f2a3a] text-sm text-[#EBE2DD] shadow-[0_0_14px_rgba(31,42,58,0.35)] hover:bg-[#2c3a54] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9BABBE]"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <span>
                    {weekOptions.find((opt) => opt.value === weekOffset)
                      ?.label ?? "Select week"}
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-44 rounded-xl border border-[#2c3a54] bg-[#1f2a3a] shadow-[0_8px_24px_rgba(31,42,58,0.35)]">
                    <ul className="py-1 text-sm text-[#EBE2DD]" role="listbox">
                      {weekOptions.map((opt) => (
                        <li key={opt.value}>
                          <button
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`w-full text-left px-4 py-2 transition-colors ${
                              opt.value === weekOffset
                                ? "bg-[#2c3a54] text-[#EBE2DD]"
                                : "bg-[#1f2a3a] text-[#EBE2DD] hover:bg-[#2c3a54]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleGenerateReflection}
                disabled={loadingReflection}
                className="px-6 py-3 cursor-pointer rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 shadow-[0_0_14px_rgba(31,42,58,0.25)]"
                style={{
                  background: `linear-gradient(135deg, #4B5563 0%, #1F2937 100%)`,
                }}
              >
                {loadingReflection ? "Revealing..." : "Reveal"}
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
              Click Reveal to view your unified reflection.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chatbot;
