"use client";

import { useState } from "react";
import { Plus, Trash2, X, Wand2, Layers } from "lucide-react";
import {
  COLOR_PALETTE,
  isColorAttribute,
  isValidHex,
  isLightColor,
  generateCombos,
} from "@/lib/variants";
import type { VariantDraft, ComboDraft } from "@/lib/variant-store";

const MAX_VARIANT_IMAGES = 4;

type Props = {
  draft: VariantDraft;
  onChange: (next: VariantDraft) => void;
  uploadImage: (file: File) => Promise<string | null>;
};

export function VariantEditor({ draft, onChange, uploadImage }: Props) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function patch(next: Partial<VariantDraft>) {
    onChange({ ...draft, ...next });
  }

  function setEnabled(enabled: boolean) {
    patch({ enabled });
  }

  // ─── Attributs ────────────────────────────────────────────────────────────

  function addAttribute() {
    patch({ attributes: [...draft.attributes, { name: "", values: [] }] });
  }

  function removeAttribute(index: number) {
    patch({ attributes: draft.attributes.filter((_, i) => i !== index) });
  }

  function setAttrName(index: number, name: string) {
    const attributes = draft.attributes.map((a, i) => (i === index ? { ...a, name } : a));
    patch({ attributes });
  }

  function addValue(index: number, value: string, hex: string | null) {
    const clean = value.trim();
    if (!clean) return;
    const attr = draft.attributes[index];
    if (attr.values.some((v) => v.value.toLowerCase() === clean.toLowerCase())) return;
    const attributes = draft.attributes.map((a, i) =>
      i === index ? { ...a, values: [...a.values, { value: clean, hex }] } : a
    );
    patch({ attributes });
  }

  function removeValue(index: number, valueIndex: number) {
    const attributes = draft.attributes.map((a, i) =>
      i === index ? { ...a, values: a.values.filter((_, vi) => vi !== valueIndex) } : a
    );
    patch({ attributes });
  }

  // ─── Génération des combinaisons ────────────────────────────────────────────

  function regenerate() {
    const generated = generateCombos(draft.attributes);
    const existing = new Map(draft.combos.map((c) => [c.key, c]));
    const combos: ComboDraft[] = generated.map((g) => {
      const prev = existing.get(g.key);
      return {
        key: g.key,
        label: g.label,
        parts: g.parts,
        stock: prev?.stock ?? "0",
        price: prev?.price ?? "",
        active: prev?.active ?? true,
        images: prev?.images ?? [],
      };
    });
    patch({ combos });
  }

  function setCombo(key: string, p: Partial<ComboDraft>) {
    patch({ combos: draft.combos.map((c) => (c.key === key ? { ...c, ...p } : c)) });
  }

  async function addComboImage(key: string, files: FileList) {
    const combo = draft.combos.find((c) => c.key === key);
    if (!combo) return;
    const room = MAX_VARIANT_IMAGES - combo.images.length;
    if (room <= 0) return;
    setUploadingKey(key);
    const urls = [...combo.images];
    for (const file of Array.from(files).slice(0, room)) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setCombo(key, { images: urls });
    setUploadingKey(null);
  }

  const comboCount = generateCombos(draft.attributes).length;
  const needsRegen =
    draft.combos.length !== comboCount ||
    !generateCombos(draft.attributes).every((g) => draft.combos.some((c) => c.key === g.key));

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 accent-violet-600"
        />
        <span className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Layers size={16} /> Ce produit a des variantes (couleurs, tailles, matières…)
        </span>
      </label>

      {draft.enabled && (
        <div className="mt-4 space-y-4">
          {/* Attributs */}
          {draft.attributes.map((attr, i) => {
            const isColor = isColorAttribute(attr.name);
            return (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    value={attr.name}
                    onChange={(e) => setAttrName(i, e.target.value)}
                    placeholder="Nom de la variante (Couleur, Taille, Matière…)"
                    className="flex-1 rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttribute(i)}
                    className="btn-icon-touch rounded-lg text-red-400 hover:bg-red-500/10"
                    aria-label="Supprimer l'attribut"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Valeurs choisies */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {attr.values.map((v, vi) => (
                    <span
                      key={vi}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-1 pl-2 pr-1 text-sm"
                    >
                      {v.hex && (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-white/30"
                          style={{ background: v.hex }}
                        />
                      )}
                      {v.value}
                      <button
                        type="button"
                        onClick={() => removeValue(i, vi)}
                        className="rounded-full p-0.5 text-white/40 hover:text-white"
                        aria-label="Retirer"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  {attr.values.length === 0 && (
                    <span className="text-xs text-white/40">Aucune valeur ajoutée.</span>
                  )}
                </div>

                {isColor ? (
                  <ColorValueAdder onAdd={(value, hex) => addValue(i, value, hex)} />
                ) : (
                  <TextValueAdder onAdd={(value) => addValue(i, value, null)} />
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addAttribute}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
          >
            <Plus size={15} /> Ajouter une variante
          </button>

          {/* Génération — toujours visible quand les variantes sont activées */}
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-white/70">
                {comboCount > 0 ? (
                  <>
                    {comboCount} combinaison{comboCount > 1 ? "s" : ""} possible
                    {comboCount > 1 ? "s" : ""}
                    {draft.combos.length > 0 && ` · ${draft.combos.length} générée(s)`}
                  </>
                ) : (
                  "Ajoute un attribut avec au moins une valeur pour générer les variantes."
                )}
              </p>
              <button
                type="button"
                onClick={regenerate}
                disabled={comboCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Wand2 size={15} />
                {draft.combos.length === 0 ? "Générer les variantes" : "Régénérer"}
              </button>
            </div>
            {needsRegen && draft.combos.length > 0 && (
              <p className="mt-2 text-xs text-amber-300">
                Les attributs ont changé — clique sur « Régénérer » pour mettre à jour.
              </p>
            )}
          </div>

          {/* Tableau des variantes */}
          {draft.combos.length > 0 && (
            <div className="space-y-2">
              {draft.combos.map((c) => (
                <div
                  key={c.key}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-1 flex-wrap items-center gap-1.5">
                      {c.parts.map((p, pi) => (
                        <span
                          key={pi}
                          className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs"
                        >
                          {p.hex && (
                            <span
                              className="h-3 w-3 rounded-full border border-white/30"
                              style={{ background: p.hex }}
                            />
                          )}
                          {p.value}
                        </span>
                      ))}
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-white/50">
                      <input
                        type="checkbox"
                        checked={c.active}
                        onChange={(e) => setCombo(c.key, { active: e.target.checked })}
                        className="h-3.5 w-3.5 accent-violet-600"
                      />
                      Active
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-white/50">Stock</span>
                      <input
                        type="number"
                        min="0"
                        value={c.stock}
                        onChange={(e) => setCombo(c.key, { stock: e.target.value })}
                        className="w-20 rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-white/50">Prix (€) — vide = prix de base</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={c.price}
                        onChange={(e) => setCombo(c.key, { price: e.target.value })}
                        placeholder="Base"
                        className="w-28 rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-white/50">
                        Photos ({c.images.length}/{MAX_VARIANT_IMAGES})
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={c.images.length >= MAX_VARIANT_IMAGES}
                        onChange={(e) => {
                          if (e.target.files?.length) addComboImage(c.key, e.target.files);
                          e.target.value = "";
                        }}
                        className="w-44 rounded-lg border border-white/10 bg-white/10 p-1.5 text-xs disabled:opacity-50"
                      />
                    </label>
                  </div>

                  {uploadingKey === c.key && (
                    <p className="mt-2 text-xs text-white/50">Upload…</p>
                  )}
                  {c.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {c.images.map((url) => (
                        <div key={url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-14 w-14 rounded-lg border border-white/10 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCombo(c.key, { images: c.images.filter((u) => u !== url) })
                            }
                            className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-red-600 text-xs font-bold text-white"
                            aria-label="Supprimer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ajout de valeur texte (tailles, matières, versions…) ────────────────────

function TextValueAdder({ onAdd }: { onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");
  function commit() {
    onAdd(value);
    setValue("");
  }
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="Ajouter une valeur (40, M, Coton…)"
        className="flex-1 rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
      />
      <button
        type="button"
        onClick={commit}
        className="rounded-lg bg-white/10 px-3 text-sm font-medium hover:bg-white/20"
      >
        Ajouter
      </button>
    </div>
  );
}

// ─── Ajout de couleur (palette native + couleur personnalisée) ───────────────

function ColorValueAdder({ onAdd }: { onAdd: (value: string, hex: string) => void }) {
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#D7FA00");

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] text-white/50">Palette</p>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onAdd(c.name, c.hex)}
              title={c.name}
              className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${
                isLightColor(c.hex) ? "border-white/40" : "border-white/15"
              }`}
              style={{ background: c.hex }}
              aria-label={c.name}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] text-white/50">Couleur personnalisée</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            value={isValidHex(customHex) ? customHex : "#000000"}
            onChange={(e) => setCustomHex(e.target.value)}
            className="h-9 w-10 cursor-pointer rounded-lg border border-white/10 bg-transparent"
            aria-label="Choisir une couleur"
          />
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Nom (ex : Vert TYGOR)"
            className="flex-1 rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
          />
          <input
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#D7FA00"
            className="w-24 rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
          />
          <button
            type="button"
            disabled={!customName.trim() || !isValidHex(customHex)}
            onClick={() => {
              onAdd(customName.trim(), customHex);
              setCustomName("");
            }}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
