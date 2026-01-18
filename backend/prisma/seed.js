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
      label: "emotional_checkin",
      selectedModel: "claude-3-7-sonnet-20250219",
      aiResponse:
        "Feeling that weight makes sense, and it’s okay to notice how heavy it feels without rushing past it. Your mind is looping because it cares about getting things right. Try a 5-minute body scan with slow exhales to ground, then choose one tiny task to finish.",
    },
    {
      date: new Date("2026-01-10"),
      content: `Today was surprisingly peaceful. I took a long walk and felt the tension in my shoulders ease. Even though work is still waiting, for a moment I felt light and centered.`,
      label: "emotional_checkin",
      selectedModel: "claude-3-7-sonnet-20250219",
      aiResponse:
        "It’s great that you let yourself feel that lightness and noticed your body unwind. Peaceful moments can coexist with pending work. Anchor the feeling with a brief shoulder roll and three slow breaths before you start the next task.",
    },

    // ---- advice_request (GPT-4.1) ----
    {
      date: new Date("2026-01-06"),
      content: `I’m juggling so many deadlines at work and struggling to prioritize. My productivity drops whenever I multitask. I need a system to break tasks into manageable chunks and stick to them consistently.`,
      label: "advice_request",
      selectedModel: "gpt-4.1",
      aiResponse:
        "Option 1: Use time blocks with one task per block and a short buffer between. Option 2: Sort tasks by impact and deadline, then batch similar items back-to-back. Recommended next step: pick your top three tasks for tomorrow, schedule them into two focused blocks, and protect those windows.",
    },
    {
      date: new Date("2026-01-15"),
      content: `Lately I’ve been procrastinating on a personal project I care about. I feel frustrated and stuck. I want a concrete method to push past mental blocks and make steady progress.`,
      label: "advice_request",
      selectedModel: "gpt-4.1",
      aiResponse:
        "Option 1: Set a 20-minute starter timer and work only on the smallest next action. Option 2: Pair up with someone for an accountability check-in and share a tiny daily deliverable. Recommended next step: define one bite-sized deliverable you can finish in 20 minutes tonight, then book a 30-minute session on your calendar tomorrow.",
    },

    // ---- self_reflection (Cohere) ----
    {
      date: new Date("2026-01-08"),
      content: `Reflecting on the past two weeks, I notice I perform best when I focus on one thing at a time. Multitasking leads to stress and errors. I need to build routines that respect my natural flow rather than force productivity.`,
      label: "self_reflection",
      selectedModel: "command-a-03-2025",
      aiResponse:
        "You’re recognizing a pattern: single-tasking keeps you steady while multitasking scatters your energy. This highlights a core value of intentionality and respect for your own pace. Leaning into focused blocks could help you honor that value day to day.",
    },
    {
      date: new Date("2026-01-07"),
      content: `After my recent breakup, I’ve realized I often prioritize others’ needs over my own. This pattern has caused unnecessary stress, but it also gives me clarity on setting boundaries and valuing my own emotional health.`,
      label: "self_reflection",
      selectedModel: "command-a-03-2025",
      aiResponse:
        "You’re spotting a recurring pattern of self-sacrifice that drains you. Beneath it is a core value of caring for others, which now wants to be balanced with self-respect. Setting clearer boundaries aligns with both care and self-worth.",
    },
    {
      date: new Date("2026-01-12"),
      content: `Work was chaotic and overwhelming today. Deadlines collided, emails kept piling up, and I barely had time to breathe. I feel exhausted but also strangely motivated to reorganize my priorities tomorrow.`,
      label: "emotional_checkin",
      selectedModel: "claude-3-7-sonnet-20250219",
      aiResponse:
        "That exhaustion shows how hard you’ve been pushing, and it’s valid to feel overwhelmed. There’s also a spark of motivation you can nurture. Before bed, jot the top two priorities for tomorrow and take five slow breaths to steady yourself.",
    },
    {
      date: new Date("2026-01-16"),
      content: `I had a breakthrough while journaling today. Looking back at my habits and choices, I can see patterns I never noticed before. Understanding them gives me hope that I can change things gradually and sustainably.`,
      label: "self_reflection",
      selectedModel: "command-a-03-2025",
      aiResponse:
        "You’re recognizing patterns that were previously hidden, which reveals a value of curiosity and growth. Seeing those threads gives you a sense of agency over gradual change. Staying with that steady pace can help you turn insight into sustainable habits.",
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
