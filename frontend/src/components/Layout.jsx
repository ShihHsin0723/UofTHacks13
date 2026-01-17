import { Link, useLocation, useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItems = [
    { path: "/dashboard", label: "Journal Entries"},
    { path: "/profile", label: "Profile"},
    { path: "/weekly-analytics", label: "Weekly Analytics"},
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className="w-64 flex-shrink-0"
        style={{
          background: "#C3C2D5",
        }}
      >
        <div className="h-full flex flex-col p-6">
          {/* Logo/Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "#374151" }}>AI•dentity</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white shadow-lg"
                      : "hover:bg-white/50"
                  }`}
                  style={{
                    color: "#374151",
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="mt-auto pl-6 pr-4 py-3 rounded-lg hover:bg-white/50 transition-all duration-200 w-full text-left"
            style={{ color: "#374151" }}
          >
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 overflow-y-auto relative"
        style={{
          background: "#DEDDE7",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;

