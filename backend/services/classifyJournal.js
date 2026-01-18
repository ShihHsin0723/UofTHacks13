import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function classifyJournal(text) {
  if (!text || typeof text !== "string") {
    throw new Error("classifyJournal requires a text string");
  }

  const prompt = `
You are a journal entry classifier for an adaptive AI journey.

Given a journal entry, output ONLY ONE of the following labels:
- emotional_checkin: Primarily about current feelings/moods. The tone is reactive to the moment.
- advice_request: Focused on tasks, problems, or work. The user is in "doing" mode or seeking solutions.
- self_reflection: Looking at the bigger picture, analyzing personal growth, or identifying long-term patterns in life and relationships.

Rules:
- Output exactly one label
- No punctuation
- No explanation
- lowercase only

Journal entry:
"""${text}"""
`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const label = (
    res.text ?? res.candidates?.[0]?.content?.parts?.[0]?.text
  ).trim();

  return label;
}

export default classifyJournal;
