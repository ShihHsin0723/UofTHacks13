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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
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

  // Find the most recent Saturday
  const getRecentSaturday = () => {
    const today = new Date();
    const daysSinceSaturday = (today.getDay() - 6 + 7) % 7;
    const recentSaturday = new Date(today);
    recentSaturday.setDate(today.getDate() - daysSinceSaturday);
    recentSaturday.setHours(0, 0, 0, 0);
    return recentSaturday;
  };

  const recentSaturday = getRecentSaturday();

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
            .then(res => res.json())
            .then(data => ({ date: checkDate, hasEntries: Array.isArray(data) && data.length > 0 }))
            .catch(() => ({ date: checkDate, hasEntries: false }))
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
      
      setDatesWithEntries(prev => {
        const combined = new Set(prev);
        newDatesWithEntries.forEach(key => combined.add(key));
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
    event.stopPropagation(); // Prevents triggering the date click
    navigate("/weekly-analytics");
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Layout>
      <div className="min-h-screen p-8" style={{ background: "linear-gradient(to bottom right, #cdd5e1, #e1dff0, #f1e7dd)" }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: "#374151" }}>
            Journal Entries
          </h1>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#9BABBE" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold" style={{ color: "#9BABBE" }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#9BABBE" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-semibold py-2" style={{ color: "#9BABBE" }}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="aspect-square" />;

                const isCurrentDay = isToday(date);
                const isSelectedDay = isSelected(date);
                const isFuture = isFutureDate(date);
                const hasJournalEntry = hasEntry(date);
                const isRecentSaturday = 
                  date.getDate() === recentSaturday.getDate() &&
                  date.getMonth() === recentSaturday.getMonth() &&
                  date.getFullYear() === recentSaturday.getFullYear();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    disabled={isFuture}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center font-medium relative transition-all duration-200 p-2 ${
                      isSelectedDay ? "bg-white shadow-lg scale-105" : 
                      isCurrentDay ? "bg-white/50 hover:bg-white/70" : 
                      isFuture ? "bg-gray-100/50" : "bg-gray-50 hover:bg-white/50"
                    }`}
                    style={{
                      backgroundColor: (hasJournalEntry && !isSelectedDay) ? "#e1f5d5" : undefined,
                      color: isFuture ? "#9CA3AF" : isSelectedDay ? "#9BABBE" : "#6B7280",
                      border: isCurrentDay ? "2px solid #9BABBE" : "none",
                      cursor: isFuture ? "not-allowed" : "pointer",
                      opacity: isFuture ? 0.7 : 1,
                    }}
                  >
                    {/* Top row: Lock icon or spacer */}
                    <div className="w-full flex justify-between items-start mb-auto">
                      <div className="z-10">
                        {isFuture && (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#D1D5DB" }}>
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Middle: Date Number */}
                    <span className="relative z-10 text-lg">{date.getDate()}</span>

                    {/* Bottom: Gift Icon for Saturday Analytics */}
                    <div className="mt-auto">
                      {isRecentSaturday && (
                        <div 
                          onClick={handleGiftClick}
                          className="cursor-pointer p-1 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 7h-2.18a3 3 0 0 0 .82-2 3 3 0 0 0-5-2.24L12 4.1l-1.64-1.34A3 3 0 0 0 5.36 5a3 3 0 0 0 .82 2H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1ZM13 4a1 1 0 1 1 1 1h-1ZM9 3a1 1 0 0 1 .6.2A1 1 0 0 1 10 4a1 1 0 0 1-1 1H8a1 1 0 0 1 1-2Zm-4 5h6v3H5Zm0 5h6v5H5Zm8 5v-5h6v5Zm6-7h-6V8h6Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: "#9BABBE" }}>
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h3>
            <p className="text-gray-600">Your journal entries for this date will appear here.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;