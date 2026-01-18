import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

// --- New helper: suggestTopics ---
async function suggestTopics(entriesText) {
  if (!entriesText || typeof entriesText !== "string") {
    throw new Error("suggestTopics requires a text string of past entries");
  }

  const prompt = `
You are an intelligent journaling assistant. Your user interacts in three primary modes: 
1. Emotional Check-in (processing feelings)
2. Request Advice (problem-solving/seeking guidance)
3. Self-Reflection (analyzing patterns and growth)

Analyze these entries from the past 3 days:
"""${entriesText}"""

Identify the dominant mode. Then, generate 3 "Entry Starters" for the user to write about today.

Rules for Suggested Topics:
- Use 2–4 words maximum.
- Do NOT use questions or periods.
- Return one topic per line.

Example output:
My current headspace
Today's small wins
My evening reflections
`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite", // same as classifyJournal
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  // Gemini returns text in res.text or fallback candidates
  const rawText = res.text ?? res.candidates?.[0]?.content?.[0]?.text ?? "";

  // Convert to array
  const topics = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return topics;
}

export default suggestTopics;
