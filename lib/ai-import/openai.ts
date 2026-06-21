// Fournisseur OpenAI Vision (modulaire). Activé si OPENAI_API_KEY est présent.
// En cas d'échec d'une image, on retombe proprement sur l'heuristique.

import type {
  ImageAnalyzer,
  ContentGenerator,
  ImageAnalysis,
  ProductContent,
  ProductSummary,
} from "./types";
import { HeuristicAnalyzer, HeuristicContentGenerator } from "./heuristic";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const CONCURRENCY = 4;

function apiKey(): string {
  return process.env.OPENAI_API_KEY || "";
}

async function chat(body: Record<string, unknown>): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`openai_${res.status}:${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(content: string): T | null {
  try {
    const cleaned = content.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

async function mapLimited<I, O>(items: I[], limit: number, fn: (i: I) => Promise<O>): Promise<O[]> {
  const out: O[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      out[cur] = await fn(items[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const ANALYSIS_PROMPT = `Tu es un expert e-commerce. Analyse l'image du produit et réponds STRICTEMENT en JSON:
{"productType": string|null, "brand": string|null, "model": string|null, "category": string|null, "colorName": string|null, "dominantHex": string|null, "size": string|null, "confidence": number}
- "category": une catégorie large en français (ex: Sneakers, Sacs, T-shirts).
- "dominantHex": couleur dominante du produit en #RRGGBB.
- "size": uniquement si une taille/pointure est clairement visible, sinon null.
- "confidence": 0 à 1, ta certitude globale.
Ne renvoie que le JSON.`;

export class OpenAIAnalyzer implements ImageAnalyzer {
  readonly name = "openai";
  private fallback = new HeuristicAnalyzer();

  async analyze(images: { url: string; name?: string | null }[]): Promise<ImageAnalysis[]> {
    return mapLimited(images, CONCURRENCY, async (img) => {
      try {
        const content = await chat({
          model: VISION_MODEL,
          temperature: 0,
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: ANALYSIS_PROMPT },
                { type: "image_url", image_url: { url: img.url, detail: "low" } },
              ],
            },
          ],
        });
        const parsed = parseJson<{
          productType?: string | null;
          brand?: string | null;
          model?: string | null;
          category?: string | null;
          colorName?: string | null;
          dominantHex?: string | null;
          size?: string | null;
          confidence?: number;
        }>(content);
        if (!parsed) throw new Error("parse_failed");

        const brand = parsed.brand?.trim() || null;
        const model = parsed.model?.trim() || null;
        const productType = parsed.productType?.trim() || null;
        const signature = [brand, model, productType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .trim() || (img.name ?? "produit").toLowerCase();
        const colorName = parsed.colorName?.trim() || null;
        return {
          productType,
          brand,
          model,
          category: parsed.category?.trim() || null,
          colorName,
          dominantHex: parsed.dominantHex?.trim() || null,
          colors: colorName ? [colorName] : [],
          signature,
          size: parsed.size?.trim() || null,
          confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.6,
          raw: parsed,
        } satisfies ImageAnalysis;
      } catch {
        const [fb] = await this.fallback.analyze([img]);
        return { ...fb, raw: { ...((fb.raw as object) ?? {}), fallback: true } };
      }
    });
  }
}

const CONTENT_PROMPT = `Tu es un copywriter e-commerce francophone. À partir des infos produit, génère une fiche attractive.
Réponds STRICTEMENT en JSON:
{"title": string, "description": string, "category": string, "tags": string[], "seoTitle": string, "seoDescription": string}
- description: 2-3 phrases vendeuses en français.
- tags: 4 à 8 mots-clés pertinents en minuscules.
- seoDescription: max 160 caractères.
Ne renvoie que le JSON.`;

export class OpenAIContentGenerator implements ContentGenerator {
  readonly name = "openai";
  private fallback = new HeuristicContentGenerator();

  async generate(summary: ProductSummary): Promise<ProductContent> {
    try {
      const content = await chat({
        model: TEXT_MODEL,
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: "system", content: CONTENT_PROMPT },
          { role: "user", content: JSON.stringify(summary) },
        ],
      });
      const parsed = parseJson<ProductContent>(content);
      if (!parsed || !parsed.title) throw new Error("parse_failed");
      return {
        title: parsed.title,
        description: parsed.description ?? "",
        category: parsed.category ?? summary.category ?? "Divers",
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
        seoTitle: parsed.seoTitle ?? parsed.title,
        seoDescription: (parsed.seoDescription ?? parsed.title).slice(0, 160),
      };
    } catch {
      return this.fallback.generate(summary);
    }
  }
}
