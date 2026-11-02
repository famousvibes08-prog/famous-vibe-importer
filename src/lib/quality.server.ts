import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { createLovableResponsesProvider } from "./lovable-ai.server";

export type QualityVerdict = { safe: boolean; stars: number; reason: string };

const verdictSchema = z.object({
  safe: z.boolean(),
  stars: z.number(),
  reason: z.string(),
});

const INSTRUCTIONS = `You are FamousVibe's AI video quality inspector. You receive one frame captured from an uploaded reel.
First check safety: nudity or sexual content, graphic violence or gore, hate symbols, self-harm, illegal activity or similar guideline violations make the video unsafe.
If it is safe, judge production quality from this frame: sharpness, lighting, framing and composition. stars is an integer from 1 (very low quality) to 5 (excellent).
Write reason as one short sentence (under 90 characters) addressed to the creator.`;

export async function runQualityCheck(imageDataUrl: string): Promise<QualityVerdict> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI quality check is not configured yet");

  const { model } = createLovableResponsesProvider({ apiKey, model: "openai/gpt-6-astra" });
  const result = streamText({
    model,
    instructions: INSTRUCTIONS,
    output: Output.object({ schema: verdictSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Inspect this uploaded FamousVibe reel frame." },
          { type: "image", image: new URL(imageDataUrl) },
        ],
      },
    ],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    const parsed = await result.output;
    const stars = Math.min(5, Math.max(1, Math.round(Number(parsed.stars) || 1)));
    return {
      safe: Boolean(parsed.safe),
      stars: parsed.safe ? stars : 1,
      reason: String(parsed.reason || "").slice(0, 140),
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The AI could not finish the quality check");
    }
    throw error;
  }
}
