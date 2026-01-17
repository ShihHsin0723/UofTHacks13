const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require("dotenv").config({ quiet: true });
const cors = require("cors");
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

module.exports = app;