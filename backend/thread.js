import { BackboardClient } from "backboard-sdk";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const client = new BackboardClient({ apiKey: process.env.BACKBOARD_API_KEY });

const llm_models = {
  "gpt-4.1": "openai",
  "anthropic/claude-3.7-sonnet": "openrouter",
  "cohere/command-r-plus-08-2024": "openrouter",
  "gemini-2.5-flash": "google",
};

export function buildDailyPrompt({ label }) {
  return `You are a supportive AI journal companion. Respond to the user’s journal entry for today.

  Goals:
  - Be helpful, respectful, and non-judgmental.
  - Keep a consistent voice across days.
  - Personalize using context from earlier messages in this week’s thread only.

  Style:
  - Format: 3-4 sentences one short paragraph.
  - Ask at most ONE follow-up question only if user asks for advice explicitly.

  Entry type: ${label}

  What to do:
  1) Start with a 1-sentence reflection that shows you understood the entry.
  2) Provide 2–3 tailored points:
    - emotional_checkin: validate feelings + suggest 1 small grounding action
    - advice_request: give 2 options + a recommended next step
    - long_rant: summarize key points first, then respond

  Safety:
  - Do not diagnose or provide medical advice.

  Now respond to today’s journal entry below. `;
}

export function buildWeeklyReflectionPrompt() {
  return `You are a supportive AI journal companion. The user has finished a week of journaling in this thread. Write a weekly reflection based ONLY on the entries in this week’s thread.

  Content:
  - List top 3 themes of the week.
  - Identify 1–2 growth moments of the week.
  - List 1 challenge or stress point.
  - Suggest 1 concrete improvement for next week.
  - Give 1 sentence that represents user's identity of the week. Keep it strong, compassionate, and concise. 

  Format: 
  Themes: [theme1, theme2, theme3]
  Growth: [growth1, growth2]
  Challenge: [challenge1]
  Improvement: [improvement1]
  Identity: "xxxxx"

  Safety:
  - Do not diagnose or provide medical advice.

  Now write the weekly reflection.`;
}

async function getOrCreateThread(assistantId) {
  if (!assistantId) {
    throw new Error("ASSISTANT_ID is missing");
  }

  if (process.env.WEEKLY_THREAD_ID) {
    return process.env.WEEKLY_THREAD_ID;
  }
  if (process.env.THREAD_ID) {
    return process.env.THREAD_ID;
  }

  // Create a new thread for a new week
  const isMonday = new Date().getDay() === 1;
  if (isMonday) {
    const thread = await client.createThread(assistantId);
    return thread.threadId;
  }
}

export async function processDailyJournal(entry, label, recommendedModel) {
  const assistantId = process.env.ASSISTANT_ID;
  const threadId = await getOrCreateThread(assistantId);

  const llm_provider = llm_models[recommendedModel];

  const messageContent = buildDailyPrompt({ label }) + `JOURNAL ENTRY: ${entry}`;

  const response = await client.addMessage(threadId, {
    content: messageContent,
    model_name: recommendedModel,
    llm_provider: llm_provider,
  });

  console.log("\n--- AI Response ---");
  console.log(response.content);

  return response;
}

async function buildWeeklyReflection(model = "gemini-2.5-flash") {
  const assistantId = process.env.ASSISTANT_ID;
  const threadId = await getOrCreateThread(assistantId);

  const llm_provider = llm_models[model];

  const messageContent = buildWeeklyReflectionPrompt();

  const response = await client.addMessage(threadId, {
    content: messageContent,
    model_name: model,
    llm_provider: llm_provider,
  });

  console.log("\n--- AI End Of Week Reflection ---");
  console.log(response.content);

  return response;
}

// Example usage (commented out):
// const entry = "I feel a bit overwhelmed with the hackathon today, but I'm proud of the progress we made on the backend.";
// await processDailyJournal(entry, "emotional_checkin", "gpt-4.1");
// await buildWeeklyReflection();
