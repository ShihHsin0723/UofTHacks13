import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SmileStreak = () => {
  const [smileStreak, setSmileStreak] = useState(null);
  const [lastSmileDate, setLastSmileDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStreak = async () => {
      setIsLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view your smile streak.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/smile-streak", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isSmiling: false }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load smile streak.");
        }

        setSmileStreak(data.smileStreak ?? 0);
        setLastSmileDate(data.lastSmileDate ?? null);
      } catch (err) {
        setError(err.message || "Unable to fetch smile streak.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreak();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#cdd5e1] via-[#e1dff0] to-[#f1e7dd] text-[#1f2a3a]">
      <div className="max-w-6xl mx-auto px-6 py-14 space-y-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[#6b7287]">
            Smile Vault
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1f2a3a]">
              Your Smile Streak
            </h1>
            <p className="text-base text-[#4b5161] max-w-2xl">
              Track the joy you invest daily. Keep the streak alive and unlock a
              happier timeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/smile")}
              className="px-6 py-3 rounded-xl bg-[#1f2a3a] text-[#EBE2DD] font-semibold shadow-[0_0_18px_rgba(31,42,58,0.35)] hover:bg-[#2c3a54] transition-colors"
            >
              Open Smile Detector
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-[#404d60] text-[#EBE2DD] rounded-3xl p-8 shadow-2xl border border-[#2c3a54]">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d7d2eb]">
              Current streak
            </p>
            <div className="flex items-end gap-3 mt-4">
              <p className="text-6xl font-bold">
                {isLoading ? "…" : (smileStreak ?? "—")}
              </p>
              <span className="text-lg text-[#c6c0d8] mb-2">days</span>
            </div>
            <p className="mt-4 text-sm text-[#c6c0d8]">
              Smiling daily keeps your streak climbing. Miss a day and it
              resets.
            </p>
          </div>

          <div className="bg-[#EBE2DD] rounded-3xl p-8 border border-[#c3c2d5] shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-[#4b5161]">
                  Last smile
                </p>
                <p className="text-3xl font-bold text-[#1f2a3a] mt-2">
                  {lastSmileDate
                    ? new Date(lastSmileDate).toLocaleDateString()
                    : "No smiles yet"}
                </p>
              </div>
              <button
                onClick={() => navigate("/smile")}
                className="px-4 py-2 rounded-lg bg-[#9BABBE] text-[#1f2a3a] font-semibold shadow-[0_0_14px_rgba(155,171,190,0.45)] hover:bg-[#8d9cb4] transition-colors"
              >
                Capture a Smile
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-[#4b5161]">
              <div className="rounded-2xl border border-[#c3c2d5] p-4 bg-white/60">
                <p className="text-xs uppercase tracking-[0.12em] text-[#6b7287]">
                  Status
                </p>
                <p className="text-lg font-semibold mt-2">
                  {isLoading
                    ? "Checking…"
                    : smileStreak > 0
                      ? "On streak"
                      : "Streak pending"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#c3c2d5] p-4 bg-white/60">
                <p className="text-xs uppercase tracking-[0.12em] text-[#6b7287]">
                  Next step
                </p>
                <p className="text-lg font-semibold mt-2">
                  Smile again today to keep it going.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-[#c96a6a] text-[#EBE2DD] rounded-xl p-4 border border-[#b95757]">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SmileStreak;
