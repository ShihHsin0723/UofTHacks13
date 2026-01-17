import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";

const SmileDetector = () => {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState("Ready to show your beautiful smile?");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasDetectedSmile, setHasDetectedSmile] = useState(false);
  const navigate = useNavigate();

  const captureAndCheckSmile = async () => {
    if (hasDetectedSmile) {
      return;
    }

    setIsProcessing(true);
    setStatus("Analyzing facial expression...");

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setStatus("Error: Camera not ready");
      setIsProcessing(false);
      return;
    }

    const blob = await fetch(imageSrc).then((res) => res.blob());
    const formData = new FormData();
    formData.append("image", blob, "snapshot.jpg");

    try {
      const response = await fetch("http://localhost:3000/check-smile", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.isSmiling) {
        setStatus("Smile Detected! Smile Streak Saved.");
        setHasDetectedSmile(true);

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const streakResponse = await fetch(
              "http://localhost:3000/smile-streak",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isSmiling: true }),
              },
            );

            const streakData = await streakResponse.json();

            if (
              streakResponse.ok &&
              typeof streakData.smileStreak === "number"
            ) {
              setStatus(
                `Smile detected! Current streak: ${streakData.smileStreak}`,
              );
            }
          } catch (err) {
            console.error("Could not update smile streak", err);
          }
        }
      } else {
        setStatus("No smile detected. Show those teeth!");
      }
    } catch (error) {
      setStatus("Backend server connection failed.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[#2f3544] bg-linear-to-br from-[#D0D9E2] via-[#DEDDE7] to-[#EBE2DD]">
      <div className="max-w-md w-full bg-[#9BABBE] border border-[#C3C2D5] rounded-3xl p-8 shadow-2xl text-[#EBE2DD]">
        <header className="text-center mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#DEDDE7]">
            AI Vision Module
          </p>
          <h2 className="text-3xl font-bold text-[#EBE2DD]">Smile Detector</h2>
          <p className="text-[#DEDDE7]">Capture a moment of joy</p>
        </header>

        <div className="relative group overflow-hidden rounded-2xl border-2 border-[#C3C2D5] bg-[#D0D9E2] transition-colors">
          <div className="relative overflow-hidden rounded-2xl">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-auto scale-x-[-1]"
              videoConstraints={{
                facingMode: "user",
              }}
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-[#9BABBE]/60 flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-[#C3C2D5] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          {isProcessing && (
            <div className="absolute inset-0 bg-[#9BABBE]/60 flex items-center justify-center backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-[#C3C2D5] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6 text-center">
          <button
            onClick={captureAndCheckSmile}
            disabled={isProcessing || hasDetectedSmile}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform active:scale-95 ${
              isProcessing || hasDetectedSmile
                ? "bg-[#C3C2D5] text-[#9BABBE] cursor-not-allowed"
                : "bg-[#EBE2DD] text-[#2f3544] hover:bg-[#DEDDE7] shadow-[0_0_18px_rgba(155,171,190,0.55)]"
            }`}
          >
            {isProcessing
              ? "Processing..."
              : hasDetectedSmile
                ? "Smile Captured"
                : "Take Snapshot"}
          </button>

          <div className={`p-4 text-[#41444c]`}>
            <p className="font-medium">{status}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/smile-streak")}
            className="w-full py-3 px-6 rounded-xl font-semibold text-lg transition-colors bg-[#2f3544] text-[#EBE2DD] hover:bg-[#41485c] shadow-[0_0_14px_rgba(47,53,68,0.35)]"
          >
            Back to Smile Streak
          </button>
        </div>
      </div>

      <footer className="mt-8 text-sm text-[#2f3544]">AI•dentity 2026</footer>
    </div>
  );
};

export default SmileDetector;
