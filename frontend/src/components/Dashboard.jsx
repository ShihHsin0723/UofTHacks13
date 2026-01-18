import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";

const API_URL = "http://localhost:3000";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datesWithEntries, setDatesWithEntries] = useState(new Set());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isFutureDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const hasEntry = (date) => {
    if (!date) return false;
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return datesWithEntries.has(dateKey);
  };

  const getRecentSunday = () => {
    const today = new Date();
    const daysSinceSunday = (today.getDay() - 0 + 7) % 7;
    const recentSunday = new Date(today);
    recentSunday.setDate(today.getDate() - daysSinceSunday);
    recentSunday.setHours(0, 0, 0, 0);
    return recentSunday;
  };

  const recentSunday = getRecentSunday();

  const fetchEntriesForMonth = async (year, month) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const lastDay = new Date(year, month + 1, 0).getDate();
      const entryPromises = [];

      for (let day = 1; day <= lastDay; day++) {
        const checkDate = new Date(year, month, day);
        checkDate.setHours(0, 0, 0, 0);

        entryPromises.push(
          fetch(`${API_URL}/journal?date=${checkDate.toISOString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((data) => ({
              date: checkDate,
              hasEntries: Array.isArray(data) && data.length > 0,
            }))
            .catch(() => ({ date: checkDate, hasEntries: false })),
        );
      }

      const results = await Promise.all(entryPromises);
      const newDatesWithEntries = new Set();

      results.forEach(({ date, hasEntries }) => {
        if (hasEntries) {
          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          newDatesWithEntries.add(dateKey);
        }
      });

      setDatesWithEntries((prev) => {
        const combined = new Set(prev);
        newDatesWithEntries.forEach((key) => combined.add(key));
        return combined;
      });
    } catch (error) {
      console.error("Failed to fetch journal entries:", error);
    }
  };

  useEffect(() => {
    fetchEntriesForMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const handleDateClick = (date) => {
    if (date && !isFutureDate(date)) {
      setSelectedDate(date);
      const dateString = date.toISOString();
      navigate(`/journal?date=${encodeURIComponent(dateString)}`);
    }
  };

  const handleGiftClick = (event) => {
    event.stopPropagation();
    navigate("/weekly-analytics");
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Layout>
      <div
        className="h-full px-18 py-12 overflow-hidden flex flex-col box-border"
        style={{
          background:
            "linear-gradient(to bottom right, #cdd5e1, #e1dff0, #f1e7dd)",
        }}
      >
        <div className="w-full max-w-[1400px] mx-auto h-full flex flex-col space-y-6 min-h-0">
          <div className="flex-none space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6b7287]">
              Journal Vault
            </p>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl md:text-5xl font-bold text-[#1f2a3a]">
                Journal Entries
              </h1>
              <p className="text-base mt-1 text-[#4b5161]">
                Browse your days and hop into weekly insights.
              </p>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl shadow-xl p-6 flex-1 flex flex-col min-h-0"
            style={{ minHeight: "calc(100vh - 240px)" }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6 flex-none">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "#9BABBE" }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-2xl font-bold" style={{ color: "#9BABBE" }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "#9BABBE" }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-2 mb-2 flex-none">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold py-2"
                  style={{ color: "#9BABBE" }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div
              className="grid grid-cols-7 gap-2 flex-1 min-h-0"
              style={{
                gridTemplateRows: "repeat(5, minmax(80px, 1fr))",
                gridAutoRows: "minmax(80px, 1fr)",
              }}
            >
              {days.map((date, index) => {
                if (!date)
                  return (
                    <div key={`empty-${index}`} className="w-full h-full" />
                  );

                const isCurrentDay = isToday(date);
                const isSelectedDay = isSelected(date);
                const isFuture = isFutureDate(date);
                const hasJournalEntry = hasEntry(date);
                const isRecentSunday =
                  date.getDate() === recentSunday.getDate() &&
                  date.getMonth() === recentSunday.getMonth() &&
                  date.getFullYear() === recentSunday.getFullYear();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    disabled={isFuture}
                    className={`w-full h-full rounded-lg flex flex-col items-end justify-start font-medium relative transition-all duration-200 p-2 ${
                      isSelectedDay
                        ? "bg-white shadow-lg scale-105"
                        : isCurrentDay
                          ? "bg-white/50 hover:bg-white/70"
                          : isFuture
                            ? "bg-gray-100/50"
                            : "bg-gray-50 hover:bg-white/50"
                    }`}
                    style={{
                      // Apply pastel green if entry exists AND it's not the currently selected day
                      backgroundColor: hasJournalEntry ? "#c3dedd" : undefined,
                      color: isFuture
                        ? "#9CA3AF"
                        : isSelectedDay
                          ? "#9BABBE"
                          : "#6B7280",
                      border: isCurrentDay ? "2px solid #9BABBE" : "none",
                      cursor: isFuture ? "not-allowed" : "pointer",
                      opacity: isFuture ? 0.7 : 1,
                    }}
                  >
                    {/* Top row: Lock icon (left) and Date Number (right) */}
                    <div className="w-full flex justify-between items-start">
                      <div className="z-10">
                        {isFuture && (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            style={{ color: "#D1D5DB" }}
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      {/* This span stays in the top right corner because of items-end on parent */}
                      <span className="relative z-10 text-sm">
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Bottom row: Gift Icon for Sunday Analytics centered */}
                    <div className="mt-auto w-full flex justify-center items-center pb-1">
                      {isRecentSunday && (
                        <button
                          type="button"
                          onClick={handleGiftClick}
                          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-red-50/90 px-5 py-4 border-none shadow-none transition-all duration-300 hover:bg-red-100/90 focus:outline-none"
                          style={{ transform: "translateY(-23px)" }}
                        >
                          <svg
                            className="w-10 h-10 cursor-pointer text-red-900 transition-transform duration-300 group-hover:scale-110"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M20 7h-2.18a3 3 0 0 0 .82-2 3 3 0 0 0-5-2.24L12 4.1l-1.64-1.34A3 3 0 0 0 5.36 5a3 3 0 0 0 .82 2H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1ZM13 4a1 1 0 1 1 1 1h-1ZM9 3a1 1 0 0 1 .6.2A1 1 0 0 1 10 4a1 1 0 0 1-1 1H8a1 1 0 0 1 1-2Zm-4 5h6v3H5Zm0 5h6v5H5Zm8 5v-5h6v5Zm6-7h-6V8h6Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
