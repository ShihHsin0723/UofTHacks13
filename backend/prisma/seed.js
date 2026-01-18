import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ---- Create or find user ----
  const user = await prisma.user.upsert({
    where: { email: "testuser@example.com" },
    update: {},
    create: {
      username: "testuser",
      email: "testuser@example.com",
      password: "testpassword",
    },
  });

  const januaryEntries = [
  // ---- emotional_checkin (Claude) ----
  {
    date: new Date("2026-01-03"),
    content: `I woke up feeling restless and tense, like the weight of everything I didn’t finish yesterday was sitting on my chest. Even small tasks feel impossible right now, and I keep replaying every little mistake in my head.`,
    category: "emotional_checkin",
    model: "claude-3-7-sonnet-20250219",
  },
  {
    date: new Date("2026-01-10"),
    content: `Today was surprisingly peaceful. I took a long walk and felt the tension in my shoulders ease. Even though work is still waiting, for a moment I felt light and centered.`,
    category: "emotional_checkin",
    model: "claude-3-7-sonnet-20250219",
  },

  // ---- advice_request (GPT-4.1) ----
  {
    date: new Date("2026-01-06"),
    content: `I’m juggling so many deadlines at work and struggling to prioritize. My productivity drops whenever I multitask. I need a system to break tasks into manageable chunks and stick to them consistently.`,
    category: "advice_request",
    model: "gpt-4.1",
  },
  {
    date: new Date("2026-01-15"),
    content: `Lately I’ve been procrastinating on a personal project I care about. I feel frustrated and stuck. I want a concrete method to push past mental blocks and make steady progress.`,
    category: "advice_request",
    model: "gpt-4.1",
  },

  // ---- self_reflection (Cohere) ----
  {
    date: new Date("2026-01-08"),
    content: `Reflecting on the past two weeks, I notice I perform best when I focus on one thing at a time. Multitasking leads to stress and errors. I need to build routines that respect my natural flow rather than force productivity.`,
    category: "self_reflection",
    model: "command-a-03-2025",
  },
  {
    date: new Date("2026-01-07"),
    content: `After my recent breakup, I’ve realized I often prioritize others’ needs over my own. This pattern has caused unnecessary stress, but it also gives me clarity on setting boundaries and valuing my own emotional health.`,
    category: "self_reflection",
    model: "command-a-03-2025",
  },
  {
    date: new Date("2026-01-12"),
    content: `Work was chaotic and overwhelming today. Deadlines collided, emails kept piling up, and I barely had time to breathe. I feel exhausted but also strangely motivated to reorganize my priorities tomorrow.`,
    category: "emotional_checkin",
    model: "claude-3-7-sonnet-20250219",
  },
  {
    date: new Date("2026-01-16"),
    content: `I had a breakthrough while journaling today. Looking back at my habits and choices, I can see patterns I never noticed before. Understanding them gives me hope that I can change things gradually and sustainably.`,
    category: "self_reflection",
    model: "command-a-03-2025",
  },
];

  await prisma.journalEntry.createMany({
    data: januaryEntries.map((entry) => ({
      ...entry,
      userId: user.id,
    })),
  });

  console.log("Seeded January journal entries with 3 strict categories 🌱");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
