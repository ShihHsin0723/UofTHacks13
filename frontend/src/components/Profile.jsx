import { useState, useEffect } from "react";
import Layout from "./Layout";

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-screen p-8" style={{ background: "linear-gradient(to bottom right, #cdd5e1, #e1dff0, #f1e7dd)" }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: "#374151" }}>
            Profile
          </h1>
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            {user ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <p className="text-gray-900 font-semibold">{user.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 font-semibold">{user.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Loading user information...</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

