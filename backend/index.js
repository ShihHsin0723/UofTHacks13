import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { PrismaClient } from "@prisma/client";
import jwtAuth from "./middleware/jwtAuth.js";
import classifyJournal from "./services/classifyJournal.js";
import suggestTopics from "./services/suggestTopics.js";
import { processDailyJournal, buildWeeklyReflection } from "./thread.js";
import { generateMusic } from "./music.js";
import multer from "multer";
import {
  RekognitionClient,
  DetectFacesCommand,
} from "@aws-sdk/client-rekognition";

dotenv.config({ quiet: true });
const upload = multer(); // Stores files in memory (buffer)
const prisma = new PrismaClient();
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const startOfWeekUtc = (date) => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // Sunday=0
  const diff = (day + 6) % 7; // shift so Monday=0
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const formatStoredReflection = (record) => ({
  weekStart: record.weekStart,
  themes: record.themes ? JSON.parse(record.themes) : [],
  growthMoments: record.growthMoments ? JSON.parse(record.growthMoments) : [],
  challenge: record.challenge || "",
  improvement: record.improvement || "",
  identity: record.identity || "",
});

const reflectionToText = (reflection) => {
  if (!reflection) return "No reflection available.";
  const {
    themes = [],
    growthMoments = [],
    challenge = "",
    improvement = "",
    identity = "",
  } = reflection;
  return `Themes: ${themes.join(", ") || "None"}
Growth: ${growthMoments.join(", ") || "None"}
Challenge: ${challenge || "None"}
Improvement: ${improvement || "None"}
Identity: ${identity || "None"}`;
};

const stripJsonCodeFence = (content) => {
  if (typeof content !== "string") return content;
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
};

app.use(
  cors({
    origin: FRONTEND_URL,

    methods: ["GET", "POST", "PATCH", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  }),
);

app.use(express.json());
app.use("/media", express.static(path.join(__dirname, "media")));

app.post("/users", async (req, res) => {
  const { username, email, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    username.trim().length < 3 ||
    username.trim().length > 50 ||
    password.length < 6 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({ message: "Invalid user data" });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: email.trim() }],
      },
      select: { id: true, username: true, email: true },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Conflict: username or email already exists" });
    }

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        password,
      },
      select: {
        id: true,
        username: true,
        email: true,
        smileStreak: true,
        lastSmileDate: true,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Failed to create user", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, username, password } = req.body;

  const identifier =
    typeof email === "string"
      ? email.trim()
      : typeof username === "string"
        ? username.trim()
        : "";

  if (!identifier || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Invalid login data" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      select: {
        id: true,
        username: true,
        email: true,
        smileStreak: true,
        lastSmileDate: true,
        password: true,
      },
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { id: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        smileStreak: user.smileStreak,
        lastSmileDate: user.lastSmileDate,
      },
    });
  } catch (error) {
    console.error("Failed to login user", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/journal", jwtAuth, async (req, res) => {
  const { date, content } = req.body;

  if (typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ message: "Content is required" });
  }

  const parsedDate = date ? new Date(date) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "Invalid or missing date" });
  }

  try {
    const label = await classifyJournal(req.body.content);

    var model;
    if (label == "emotional_checkin") {
      model = "claude-3-7-sonnet-20250219";
    } else if (label == "advice_request") {
      model = "gpt-4.1";
    } else {
      model = "command-a-03-2025";
    }

    console.log(model);

    const entry = await prisma.journalEntry.create({
      data: {
        date: parsedDate,
        content: content.trim(),
        userId: req.user.id,
        category: label,
        model: model,
      },
      select: {
        id: true,
        date: true,
        content: true,
        category: true,
        model: true,
      },
    });

    // Get AI response using thread.js
    let aiResponse = null;
    try {
      const aiResult = await processDailyJournal(
        content.trim(),
        label,
        model,
        parsedDate,
        req.user.id,
      );
      aiResponse = aiResult.content;
    } catch (aiError) {
      console.error("Failed to get AI response", aiError);
      // Continue even if AI fails - entry is still saved
    }

    res.status(201).json({
      ...entry,
      aiResponse: aiResponse,
    });
  } catch (error) {
    console.error("Failed to create journal entry", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/journal", jwtAuth, async (req, res) => {
  const { date } = req.query;
  const parsedDate = date ? new Date(date) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "Invalid or missing date" });
  }

  // Normalize to start/end of day in UTC to capture all entries for that date
  const startOfDay = new Date(
    Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate(),
    ),
  );
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  try {
    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        content: true,
      },
    });

    res.status(200).json(entries);
  } catch (error) {
    console.error("Failed to fetch journal entries", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/topics", jwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const entries = await prisma.journalEntry.findMany({
      where: { userId, date: { gte: threeDaysAgo } },
      orderBy: { date: "desc" },
    });

    if (!entries.length) {
      return res.json({
        topics: [
          "No entries in the past 3 days. Start journaling to get personalized suggestions!",
        ],
      });
    }

    const entriesText = entries.map((e) => e.content).join("\n\n");

    const topics = await suggestTopics(entriesText);

    res.json({ topics });
  } catch (err) {
    console.error("Failed to generate Gemini topic suggestions", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/weekly-reflection", jwtAuth, async (req, res) => {
  const { weekStart: weekStartParam } = req.query;

  const baseDate = weekStartParam ? new Date(weekStartParam) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
    return res.status(400).json({ message: "Invalid weekStart date" });
  }

  const weekStart = startOfWeekUtc(baseDate);
  console.log("start of the week: " + weekStart);

  try {
    const musicFileName = `weekly-${req.user.id}-${weekStart.toISOString().slice(0, 10)}.mp3`;
    const musicPath = path.join(__dirname, "media", musicFileName);
    let reflectionPayload = null;
    let musicUrl = null;

    // Try to return existing reflection for this week/user
    const existing = await prisma.weeklyReflection.findUnique({
      where: {
        userId_weekStart: {
          userId: req.user.id,
          weekStart,
        },
      },
    });

    if (
      existing &&
      (existing.themes ||
        existing.growthMoments ||
        existing.challenge ||
        existing.improvement ||
        existing.identity)
    ) {
      console.log("Reflection exists");
      reflectionPayload = formatStoredReflection(existing);
    }

    // Otherwise generate, store, and return
    if (!reflectionPayload) {
      console.log("Reflection does not exist. Generate reflection");
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
      console.log("end of the week" + weekEnd);

      const weeklyEntries = await prisma.journalEntry.findMany({
        where: {
          userId: req.user.id,
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        orderBy: { date: "asc" },
        select: { date: true, content: true },
      });

      console.log("Current week entries: " + weeklyEntries.length);

      if (!weeklyEntries.length) {
        return res.status(200).json({
          message:
            "No journal entries for this week. Reflection not generated.",
          themes: [],
          growthMoments: [],
          challenge: "",
          improvement: "",
          identity: "",
          musicUrl: null,
          noJournal: true,
        });
      }

      const aiResult = await buildWeeklyReflection({
        entries: weeklyEntries,
      });
      if (aiResult?.noData) {
        return res.status(200).json({
          message:
            "No journal entries for this week. Reflection not generated.",
          themes: [],
          growthMoments: [],
          challenge: "",
          improvement: "",
          identity: "",
          musicUrl: null,
          noJournal: true,
        });
      }
      const baseReflection = {
        themes: [],
        growthMoments: [],
        challenge: "",
        improvement: "",
        identity: "",
      };

      let parsed = { ...baseReflection };
      try {
        const content =
          typeof aiResult?.content === "string"
            ? stripJsonCodeFence(aiResult.content)
            : aiResult?.content;
        if (typeof content === "string") {
          parsed = { ...baseReflection, ...(JSON.parse(content) || {}) };
        } else if (content && typeof content === "object") {
          parsed = { ...baseReflection, ...content };
        }
      } catch (parseErr) {
        console.warn("Failed to parse weekly reflection JSON", parseErr);
      }
      console.log("Generated reflection:", parsed);

      let created;
      try {
        console.log("Creating weekly reflection…");
        created = await prisma.weeklyReflection.create({
          data: {
            userId: req.user.id,
            weekStart,
            themes: JSON.stringify(parsed.themes || []),
            growthMoments: JSON.stringify(parsed.growthMoments || []),
            challenge: parsed.challenge || "",
            improvement: parsed.improvement || "",
            identity: parsed.identity || "",
          },
        });
        console.log("Created record:", created);
      } catch (err) {
        console.error("Create weekly reflection failed", err);
        throw err;
      }

      reflectionPayload = formatStoredReflection(created);
      console.log(created);
    }

    try {
      if (!existsSync(musicPath)) {
        const promptText = reflectionToText(reflectionPayload);
        await generateMusic(promptText, musicFileName);
      }
      musicUrl = `/media/${musicFileName}`;
    } catch (musicError) {
      console.error("Failed to generate music", musicError);
    }

    return res.status(200).json({
      ...reflectionPayload,
      musicUrl,
    });
  } catch (err) {
    // Handle rare race condition on unique constraint by refetching
    if (err.code === "P2002") {
      const existing = await prisma.weeklyReflection.findUnique({
        where: {
          userId_weekStart: {
            userId: req.user.id,
            weekStart,
          },
        },
      });
      if (existing) {
        const musicFileName = `weekly-${req.user.id}-${weekStart.toISOString().slice(0, 10)}.mp3`;
        const musicPath = path.join(__dirname, "media", musicFileName);
        return res.status(200).json({
          ...formatStoredReflection(existing),
          musicUrl: existsSync(musicPath) ? `/media/${musicFileName}` : null,
        });
      }
    }

    console.error("Failed to build weekly reflection", err);
    return res
      .status(500)
      .json({ message: "Failed to build weekly reflection" });
  }
});

app.post("/check-smile", upload.single("image"), async (req, res) => {
  try {
    const params = {
      Image: { Bytes: req.file.buffer }, // req.file.buffer comes from multer
      Attributes: ["ALL"],
    };

    const command = new DetectFacesCommand(params);
    const data = await rekognition.send(command);

    if (data.FaceDetails && data.FaceDetails.length > 0) {
      const face = data.FaceDetails[0];
      const isSmiling = face.Smile.Value; // Boolean (true/false)
      const confidence = face.Smile.Confidence;

      res.json({ isSmiling, confidence });
    } else {
      res.status(400).json({ error: "No face detected" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/smile-streak", jwtAuth, async (req, res) => {
  const { isSmiling } = req.body;

  if (typeof isSmiling !== "boolean") {
    return res.status(400).json({
      message: "isSmiling boolean is required to update smile streak",
    });
  }

  const now = new Date();
  // Normalize to the user's local calendar day to avoid UTC-based off-by-one issues
  const todayLocalStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { smileStreak: true, lastSmileDate: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If no smile detected, return current streak without changing the date
    if (!isSmiling) {
      return res.status(200).json({
        message: "No smile detected; streak unchanged",
        smileStreak: user.smileStreak,
        lastSmileDate: user.lastSmileDate,
      });
    }

    let newStreak = 1;

    if (user.lastSmileDate) {
      const last = new Date(user.lastSmileDate);
      // Interpret the stored date as a calendar day using UTC components, then compare to local today.
      const lastDay = new Date(
        last.getUTCFullYear(),
        last.getUTCMonth(),
        last.getUTCDate(),
      );
      const diffDays = Math.floor(
        (todayLocalStart.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        newStreak = user.smileStreak; // already smiled today
      } else if (diffDays === 1) {
        newStreak = user.smileStreak + 1; // consecutive day
      } else {
        newStreak = 1; // streak broken
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        smileStreak: newStreak,
        // Store the timestamp for today so it aligns with the user's local day.
        lastSmileDate: todayLocalStart,
      },
      select: {
        id: true,
        username: true,
        smileStreak: true,
        lastSmileDate: true,
      },
    });

    return res.status(200).json({
      message: "Smile recorded",
      smileStreak: updated.smileStreak,
      lastSmileDate: updated.lastSmileDate,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    console.error("Failed to update smile streak", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default app;
