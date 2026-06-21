// Registre du moteur IA. Sélectionne le fournisseur selon la configuration.
// Architecture volontairement modulaire : pour ajouter Google Lens / Bing /
// un autre moteur, implémente ImageAnalyzer/ContentGenerator et branche-le ici.

import type { ImportEngine } from "./types";
import { HeuristicAnalyzer, HeuristicContentGenerator } from "./heuristic";
import { OpenAIAnalyzer, OpenAIContentGenerator } from "./openai";

export function getImportEngine(): ImportEngine {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  if (hasOpenAI) {
    return {
      analyzer: new OpenAIAnalyzer(),
      content: new OpenAIContentGenerator(),
      live: true,
      providerName: "openai",
    };
  }
  return {
    analyzer: new HeuristicAnalyzer(),
    content: new HeuristicContentGenerator(),
    live: false,
    providerName: "heuristic",
  };
}
