import { useState } from "react";
import Layout from "./Layout";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
    };

    setMessages([...messages, newMessage]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: "This is a placeholder response. Connect to your chatbot API to enable real conversations!",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  return (
    <Layout>
      <div className="p-8 h-full flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
          <h1 className="text-4xl font-bold mb-8" style={{ color: "#374151" }}>
            Weekly Analytics
          </h1>
          
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  Start a conversation with your AI assistant!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === "user"
                          ? "bg-white border-2"
                          : "bg-white/50"
                      }`}
                      style={{
                        borderColor: message.sender === "user" ? "#9BABBE" : "transparent",
                      }}
                    >
                      <p className="text-gray-800">{message.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#9BABBE] focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, #9BABBE 0%, #C3C2D5 100%)`,
                  }}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chatbot;

