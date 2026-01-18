import { BackboardClient } from "backboard-sdk";
import dotenv from "dotenv";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ quiet: true });

const client = new BackboardClient({ apiKey: process.env.BACKBOARD_API_KEY });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THREAD_STORE_PATH = path.join(__dirname, ".weekly-threads.json");

const llm_models = {
  "gpt-4.1": "openai",
  "claude-3-7-sonnet-20250219": "anthropic",
  "command-a-03-2025": "cohere",
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

function startOfWeekUtc(date) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // Sunday=0
  const diff = (day + 6) % 7; // shift so Monday=0
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function readThreadStore() {
  try {
    if (!existsSync(THREAD_STORE_PATH)) return {};
    const raw = readFileSync(THREAD_STORE_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch (err) {
    console.error("Failed to read thread store, starting fresh", err);
    return {};
  }
}

function writeThreadStore(store) {
  try {
    writeFileSync(THREAD_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write thread store", err);
  }
}

async function getOrCreateThread({
  assistantId,
  userId = "global",
  date = new Date(),
}) {
  if (!assistantId) {
    throw new Error("ASSISTANT_ID is missing");
  }

  const targetDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(targetDate.getTime())) {
    throw new Error("Invalid date supplied for thread lookup");
  }

  const weekStartIso = startOfWeekUtc(targetDate).toISOString();
  const userKey = String(userId || "global");
  const store = readThreadStore();

  if (store[userKey] && store[userKey][weekStartIso]) {
    return store[userKey][weekStartIso];
  }

  const thread = await client.createThread(assistantId);
  const updated = {
    ...store,
    [userKey]: { ...(store[userKey] || {}), [weekStartIso]: thread.threadId },
  };
  writeThreadStore(updated);
  return thread.threadId;
}

export async function processDailyJournal(
  entry,
  label,
  recommendedModel,
  entryDate = new Date(),
  userId,
) {
  const assistantId = process.env.ASSISTANT_ID;
  const threadId = await getOrCreateThread({
    assistantId,
    userId,
    date: entryDate,
  });

  const llm_provider = llm_models[recommendedModel];

  const messageContent =
    buildDailyPrompt({ label }) + `JOURNAL ENTRY: ${entry}`;

  const response = await client.addMessage(threadId, {
    content: messageContent,
    model_name: recommendedModel,
    llm_provider: llm_provider,
  });

  console.log("\n--- AI Response ---");
  console.log(response.content);

  return response;
}

export async function buildWeeklyReflection({
  model = "gemini-2.5-flash",
  forDate = new Date(),
  userId,
} = {}) {
  const assistantId = process.env.ASSISTANT_ID;
  const threadId = await getOrCreateThread({
    assistantId,
    userId,
    date: forDate,
  });

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
// const entry =
//   "I feel a bit overwhelmed with the hackathon today, but I'm proud of the progress we made on the backend.";
// await processDailyJournal(entry, "emotional_checkin", "command-a-03-2025");
// await buildWeeklyReflection();
