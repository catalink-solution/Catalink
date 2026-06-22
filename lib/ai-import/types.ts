// AI Smart Import — types partagés (DB rows + contrats moteur IA).

// ─── Statuts ────────────────────────────────────────────────────────────────

export type ImportJobStatus =
  | "pending" // créé, fichiers en cours d'enregistrement
  | "analyzing" // analyse visuelle par lots (fallback sans vision)
  | "clustering" // regroupement vision IA (ou fallback local)
  | "ready_for_group_review" // groupes proposés — validation utilisateur
  | "generating" // génération du contenu (titre/desc/SEO) après validation
  | "ready_for_review" // prêt pour publication
  | "publishing"
  | "done"
  | "error";

export type ImportSourceType = "upload" | "folder" | "zip" | "url" | "extension";

export type DetectedProductStatus =
  | "needs_review"
  | "auto_validated"
  | "published"
  | "rejected";

// ─── DB rows ──────────────────────────────────────────────────────────────

export type ImportJob = {
  id: string;
  shop_id: string;
  status: ImportJobStatus;
  source_type: ImportSourceType;
  total_files: number;
  processed_files: number;
  detected_count: number;
  estimated_seconds: number | null;
  group_mode: "auto" | "per_image";
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ImportFile = {
  id: string;
  job_id: string;
  shop_id: string;
  storage_path: string | null;
  image_url: string;
  original_name: string | null;
  status: "pending" | "analyzed" | "grouped" | "error";
  detected_product_id: string | null;
  variant_label: string | null;
  sort_order: number;
  phash: string | null;
  dhash: string | null;
  avg_hex: string | null;
  error: string | null;
  created_at: string;
};

export type ImportDetectedProduct = {
  id: string;
  job_id: string;
  shop_id: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  description: string | null;
  tags: string[];
  main_color: string | null;
  cover_image_url: string | null;
  confidence: number;
  status: DetectedProductStatus;
  sale_price: number | null;
  published_product_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ImportDetectedVariant = {
  id: string;
  detected_product_id: string;
  job_id: string;
  shop_id: string;
  attribute_name: string;
  value: string;
  hex: string | null;
  confidence: number;
  created_at: string;
};

// ─── Contrats du moteur IA (modulaires, multi-fournisseurs) ─────────────────

/** Résultat d'analyse visuelle d'une image. */
export type ImageAnalysis = {
  productType: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  colorName: string | null;
  dominantHex: string | null;
  colors: string[];
  /**
   * Signature de regroupement = marque + modèle + type SANS couleur ni taille.
   * Deux images de même produit (couleurs différentes) partagent la même
   * signature → elles deviennent des variantes, pas des produits distincts.
   */
  signature: string;
  /** Taille visible si détectée (ex : "42", "M"). */
  size: string | null;
  confidence: number; // 0..1
  raw?: unknown;
};

/** Contenu marketing généré pour un produit regroupé. */
export type ProductContent = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
};

/** Données agrégées d'un produit détecté, fournies au générateur de contenu. */
export type ProductSummary = {
  brand: string | null;
  model: string | null;
  productType: string | null;
  category: string | null;
  colorNames: string[];
  sizes: string[];
};

/** Un fournisseur d'analyse visuelle (OpenAI Vision, Google Lens, …). */
export interface ImageAnalyzer {
  readonly name: string;
  analyze(images: { url: string; name?: string | null }[]): Promise<ImageAnalysis[]>;
}

/** Un générateur de contenu produit (titre/description/SEO). */
export interface ContentGenerator {
  readonly name: string;
  generate(summary: ProductSummary): Promise<ProductContent>;
}

/** Entrée pour le regroupement vision par lot. */
export type VisionGroupInput = {
  fileId: string;
  imageUrl: string;
  name?: string | null;
  sortOrder: number;
  phash?: string | null;
  dhash?: string | null;
  avgHex?: string | null;
  analysis?: ImageAnalysis;
};

/** Groupe produit retourné par l'IA vision. */
export type VisionProductGroup = {
  temporaryProductName: string;
  fileIds: string[];
  category: string | null;
  brand: string | null;
  mainColor: string | null;
  model?: string | null;
  reason: string;
  confidence: number;
};

export type VisionGroupingResult = {
  groups: VisionProductGroup[];
  method: "vision" | "local_fallback";
  provider: string;
  batchesSent: number;
  rawResponse?: unknown;
  fallbackReason?: string;
};

/** Regroupement multimodal par lot (OpenAI Vision, Claude, …). */
export interface ImageGrouper {
  readonly name: string;
  groupImages(files: VisionGroupInput[]): Promise<VisionGroupingResult>;
}

export type ImportEngine = {
  analyzer: ImageAnalyzer;
  content: ContentGenerator;
  grouper: ImageGrouper | null;
  /** true si un vrai fournisseur IA est actif (clé présente). */
  live: boolean;
  providerName: string;
  /** true si le regroupement vision par lot est disponible. */
  visionGrouping: boolean;
};

export const AUTO_VALIDATE_CONFIDENCE = 0.8;
