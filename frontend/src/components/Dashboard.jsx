import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [journalEntries, setJournalEntries] = useState([]);

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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
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

  // Find the most recent Saturday (including today if today is Saturday)
  const getRecentSaturday = () => {
    const today = new Date();
    const daysSinceSaturday = (today.getDay() - 6 + 7) % 7;
    const recentSaturday = new Date(today);
    recentSaturday.setDate(today.getDate() - daysSinceSaturday);
    return recentSaturday;
  };

  const recentSaturday = getRecentSaturday();

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);

      // If clicking today's date, navigate to journal screen
      if (isToday(date)) {
        const dateString = date.toISOString();
        navigate(`/journal?date=${encodeURIComponent(dateString)}`);
      }
    }
  };

  const handleGiftClick = (event) => {
    event.stopPropagation();
    navigate("/weekly-analytics");
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: "#374151" }}>
            Journal Entries
          </h1>

          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
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

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
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
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const isCurrentDay = isToday(date);
                const isSelectedDay = isSelected(date);
                const isRecentSaturday =
                  date.getDate() === recentSaturday.getDate() &&
                  date.getMonth() === recentSaturday.getMonth() &&
                  date.getFullYear() === recentSaturday.getFullYear();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    className={`group aspect-square rounded-lg transition-all duration-200 flex items-center justify-center font-medium ${
                      isSelectedDay
                        ? "bg-white shadow-lg scale-105"
                        : isCurrentDay
                          ? "bg-white/50 hover:bg-white/70"
                          : "bg-gray-50 hover:bg-white/50"
                    }`}
                    style={{
                      color: isSelectedDay ? "#9BABBE" : "#6B7280",
                      border: isCurrentDay ? "2px solid #9BABBE" : "none",
                      cursor: isCurrentDay ? "pointer" : "default",
                    }}
                  >
                    <div className="flex flex-col items-center gap-1 leading-tight">
                      <span>{date.getDate()}</span>
                      {isRecentSaturday && (
                        <button
                          type="button"
                          onClick={handleGiftClick}
                          className="inline-flex items-center justify-center rounded-full bg-red-50/90 px-5 py-4 border-none shadow-none transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110 hover:bg-red-100/90 focus:outline-none"
                        >
                          <svg
                            className="w-10 h-10 text-red-900 transition-transform duration-300 group-hover:scale-110"
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
          {/* Selected Date Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: "#9BABBE" }}
            >
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <div className="space-y-4">
              {/* Journal entries for selected date would go here */}
              <p className="text-gray-600">
                Your journal entries for this date will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
