// Registre du moteur IA. Sélectionne le fournisseur selon la configuration.

import type { ImportEngine } from "./types";
import { HeuristicAnalyzer, HeuristicContentGenerator } from "./heuristic";
import { OpenAIAnalyzer, OpenAIContentGenerator } from "./openai";
import { OpenAIVisionGrouper } from "./openai-grouper";

function aiProvider(): string {
  return (process.env.AI_PROVIDER || "openai").toLowerCase();
}

export function getImportEngine(): ImportEngine {
  const provider = aiProvider();
  const hasOpenAI = provider === "openai" && Boolean(process.env.OPENAI_API_KEY);

  if (hasOpenAI) {
    console.info(
      "VISION_GROUPING_ACTIVE",
      JSON.stringify({ engine: "openai", visionGrouping: true, hasApiKey: true })
    );
    return {
      analyzer: new OpenAIAnalyzer(),
      content: new OpenAIContentGenerator(),
      grouper: new OpenAIVisionGrouper(),
      live: true,
      providerName: "openai",
      visionGrouping: true,
    };
  }

  console.info(
    "VISION_GROUPING_FALLBACK",
    JSON.stringify({ engine: "heuristic", reason: "OPENAI_API_KEY missing or AI_PROVIDER != openai" })
  );
  return {
    analyzer: new HeuristicAnalyzer(),
    content: new HeuristicContentGenerator(),
    grouper: null,
    live: false,
    providerName: "heuristic",
    visionGrouping: false,
  };
}
