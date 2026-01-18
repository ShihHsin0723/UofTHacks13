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
// const weeklyReflection1 = {
//   themes: [
//     "Emotional Exhaustion",
//     "Persistent Overwhelm",
//     "Loss of Motivation",
//   ],
//   Growth: [
//     "Continuing to function despite feeling drained",
//     "Enduring pressure without immediate relief or recognition",
//   ],
//   Challenge: [
//     "Feeling constantly behind and mentally overwhelmed by",
//     "never-ending, time-sensitive responsibilities",
//   ],
//   Improvement: [
//     "Next week may require lowering expectations and simply",
//     "focusing on getting through tasks rather than doing them well.",
//   ],
//   Identity:
//     "You are someone who keeps going out of necessity, even when motivation fades and the weight of responsibility feels heavy.",
// };

// const weeklyReflection = {
//   themes: [
//     "Mounting Pressure",
//     "Gradual Emotional Fatigue",
//     "Resigned Persistence",
//   ],
//   Growth: [
//     "Pushing forward even as motivation slowly diminishes",
//     "Adapting to stress by becoming emotionally quieter rather than stronger",
//   ],
//   Challenge: [
//     "What began as manageable pressure gradually turned into",
//     "constant mental noise and an ongoing sense of being behind",
//   ],
//   Improvement: [
//     "Next week may involve accepting limited capacity and",
//     "moving forward slowly instead of expecting renewed energy",
//   ],
//   Identity:
//     "You are someone who transitions from effort to endurance, learning to exist within pressure even when enthusiasm quietly fades.",
// };

// The Music Prompt Generator
export function buildMusicPrompt({ weeklyReflectionText }) {
  return `
  Create a track that represents the user's themes over the past week. Try to avoid rap, but feel free to include lyrics. Prefer no reading given keywords directly. 

  Examples:
  - If user has an exciting week, create an intense, fast-paced, and hyped track. The tempo should be fast, 130–150 bpm, with rising tension, quick transitions, and dynamic energy bursts.
  - If user has a relaxing week, create a soothing, peaceful, and light-hearted track. 
  - If user has mixed of emotions over the week, create a track with transitions between energy, rhythm, etc.
  
  Here are the highlist of user's week:
  ${weeklyReflectionText}
`;
}

export async function generateMusic(
  weeklyReflection,
  fileName = "composition.mp3",
) {
  try {
    console.log("Step 1: Creating composition plan...");

    const weeklyReflectionText =
      typeof weeklyReflection === "string"
        ? weeklyReflection
        : JSON.stringify(weeklyReflection, null, 2);

    // We create the plan first to get the structured sections
    const planResponse = await elevenlabs.music.compositionPlan.create({
      prompt: buildMusicPrompt({ weeklyReflectionText }),
      musicLengthMs: 15000,
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
