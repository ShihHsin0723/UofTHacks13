const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config({ quiet: true });
const cors = require("cors");
const jwt = require("jsonwebtoken");
const jwtAuth = require("./middleware/jwtAuth");
const express = require("express");
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,

    methods: ["GET", "POST", "PATCH", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  })
);

app.use(express.json());

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

  const identifier = typeof email === "string" ? email.trim() : typeof username === "string" ? username.trim() : "";

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
        password: true,
      },
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { id: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Failed to login user", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = app;
