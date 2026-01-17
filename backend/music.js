import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import "dotenv/config";

const elevenlabs = new ElevenLabsClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.join(__dirname, "media");

if (!existsSync(mediaDir)) {
  mkdirSync(mediaDir, { recursive: true });
}

// Example Reflection Data
// const weeklyReflection = {
//   themes: [
//     "Technical Project Engagement",
//     "Managing Overwhelm",
//     "Celebrating Progress",
//   ],
//   Growth: [
//     "Acknowledging accomplishments despite stress",
//     "Demonstrating resilience in high-pressure environments",
//   ],
//   Challenge: [
//     "Experiencing overwhelm during intense",
//     "time-sensitive projects",
//   ],
//   Improvement: [
//     "Next week, consider proactively scheduling short",
//     "intentional breaks to manage stress during demanding work periods.",
//   ],
//   Identity:
//     "You are a dedicated and resilient individual who finds strength in your contributions, even amidst intense pressure.",
// };

// The Music Prompt Generator
export function buildMusicPrompt({ weeklyReflectionText }) {
  return `
  Music that represents the user’s emotional identity over the past week. 
  The music should reflect mood, energy, tension, and growth — not lyrics or spoken words.
  Make the music unique. Do NOT be generic.
  Always include at least a bit of positiveness.

  Translate emotions and patterns into musical elements such as:
    - tempo
    - key or mode (major, minor, modal, ambiguous)
    - instrumentation
    - harmony vs dissonance
    - rhythm complexity
    - dynamics (soft → intense, static → evolving)
    - overall structure (build-up, release, looping, unresolved, etc.)

    ${weeklyReflectionText}
`;
}

export async function generateMusic(weeklyReflection, fileName = "composition.mp3") {
  try {
    console.log("Step 1: Creating composition plan...");

    const weeklyReflectionText =
      typeof weeklyReflection === "string"
        ? weeklyReflection
        : JSON.stringify(weeklyReflection, null, 2);

    // We create the plan first to get the structured sections
    const planResponse = await elevenlabs.music.compositionPlan.create({
      prompt: buildMusicPrompt({ weeklyReflectionText }),
      musicLengthMs: 10000,
    });

    console.log("Step 2: Sending plan to Compose endpoint...");

    /**
     * EXTRACTED FIX:
     * Per the OpenAPI spec, the body should contain a 'composition_plan' object.
     * We map the planResponse directly to the MusicPrompt schema.
     */
    const compositionStream = await elevenlabs.music.compose({
      compositionPlan: {
        positiveGlobalStyles: planResponse.positiveGlobalStyles,
        negativeGlobalStyles: planResponse.negativeGlobalStyles,
        sections: planResponse.sections,
      },
      modelId: "music_v1",
      respectSectionsDurations: true,
    });

    const outputPath = path.join(mediaDir, fileName);
    console.log("Step 3: Streaming audio to file (this may take 30-60s)...");

    // The API returns a binary octet-stream (ReadableStream)
    await pipeline(
      Readable.fromWeb(compositionStream),
      createWriteStream(outputPath),
    );

    console.log(`\nSuccess! Saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    if (error.errors) {
      console.error("Validation Error:", JSON.stringify(error.errors, null, 2));
    } else {
      console.error("Error details:", error);
    }
    throw error;
  }
}
