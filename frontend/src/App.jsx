import { Routes, Route, BrowserRouter } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Chatbot from "./components/WeeklyAnalytics";
import Journal from "./components/Journal";
import SmileStreakTab from "./components/SmileStreakTab";
import SmileDetector from "./pages/SmileDetector";

const MyRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/weekly-analytics" element={<Chatbot />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/smile-streak" element={<SmileStreakTab />} />
      <Route path="/smile-detector" element={<SmileDetector />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <MyRoutes />
    </BrowserRouter>
  );
}

export default App;
