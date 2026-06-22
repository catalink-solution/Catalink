# Catalink — Design System

Document de référence pour l’interface Catalink.  
**Toute nouvelle page ou feature doit respecter ce guide.**

---

## Principes

1. **Dark premium SaaS** — fond navy/noir, accents violet, glassmorphism subtil.
2. **Cohérence** — réutiliser les composants et tokens ci-dessous, pas de styles ad hoc.
3. **Pas de composants natifs navigateur** pour l’UI interactive :
   - interdit : `<select>`, `<input type="date">` non stylé, `<dialog>` natif sans wrapper
   - obligatoire : composants Catalink (`CustomSelect`, classes `.input`, etc.)
4. **Accessibilité** — focus visible, labels, navigation clavier sur les composants custom.
5. **Mobile-first** — cibles tactiles ≥ 44px (`.btn-touch`, `.touch-target`).

---

## Couleurs

Tokens définis dans `app/globals.css` (`:root`).

| Token | Variable CSS | Valeur | Usage |
|-------|--------------|--------|--------|
| **Fond principal** | `--background` | `#030712` | Body, pages auth, canvas global |
| **Fond secondaire** | — | `#06080f` | Header dashboard, trigger select, zones structurantes |
| **Surface carte** | `--surface` | `rgba(255,255,255,0.03)` | Cards, panneaux (`bg-white/[0.02]`) |
| **Fond modal / panel** | — | `#090B14` / `#0f1117` | Modales, dropdown panel |
| **Violet primaire** | `--brand-secondary` | `#7c3aed` | Bordures focus, accents, CTA gradient |
| **Violet hover** | — | `violet-600/20` (options), `brightness(1.1)` (CTA) | Hover dropdown, boutons |
| **Indigo marque** | `--brand-primary` | `#4f46e5` | Glow, sélection texte |
| **Bleu accent** | `--brand-accent` | `#3b82f6` | Début gradient CTA primaire |
| **Texte principal** | `--foreground` | `#f4f4f5` | Titres, contenu |
| **Texte secondaire** | `--muted` | `#a1a1aa` | Descriptions, labels (`text-white/50`, `text-white/60`) |
| **Bordure surface** | `--surface-border` | `rgba(255,255,255,0.08)` | `border-white/10` |

### Classes utilitaires marque

| Classe | Usage |
|--------|--------|
| `.gradient-text` | Titres hero, accents marketing |
| `.landing-glow` / `.landing-grid` | Arrière-plans landing uniquement |
| `.brand-glow` | Halo violet décoratif |

### Tailwind — raccourcis fréquents

```
bg-[#030712]          → fond page dashboard
bg-[#06080f]          → sidebar, header
bg-white/[0.02]       → card
border-white/10       → bordure card
text-white/50         → texte secondaire
border-violet-500/50  → bordure interactive
ring-violet-500/40    → focus ring
bg-violet-600/20      → hover option / nav active léger
```

---

## Typographie

- **Police** : Geist Sans (`var(--font-geist-sans)`)
- **Titres page** : `text-3xl font-extrabold tracking-tight`
- **Sous-titre** : `text-sm text-white/50`
- **Label champ** : `text-sm font-medium text-white/70` ou `text-xs text-white/60`
- **KPI valeur** : `text-2xl font-bold`
- **Table header** : `text-xs uppercase tracking-wide text-white/40`

---

## Composants officiels

### 1. Bouton primaire

**Landing / marketing** — classe globale `.cta-primary` (`app/globals.css`).

```html
<a href="..." class="cta-primary">Action principale</a>
<button type="button" class="cta-primary btn-touch">Action</button>
```

| Propriété | Valeur |
|-----------|--------|
| Fond | Gradient `#3b82f6` → `#7c3aed` |
| Forme | `rounded-full` |
| Texte | Blanc, `font-medium`, `text-sm` |
| Ombre | Glow indigo |
| Hover | `brightness(1.1)` |

**Dashboard / app** — pattern inline (à unifier dans `components/ui/button.tsx` à terme) :

```html
<button
  type="button"
  class="btn-touch rounded-xl bg-violet-600 px-6 py-3 font-bold text-white hover:bg-violet-500 disabled:opacity-50"
>
  Enregistrer
</button>
```

Gradient dashboard (formulaires) :

```html
style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
class="btn-touch w-full rounded-xl px-5 py-3 font-bold text-white"
```

---

### 2. Bouton secondaire

**Landing** — `.cta-secondary` :

```html
<a href="..." class="cta-secondary">Action secondaire</a>
```

| Propriété | Valeur |
|-----------|--------|
| Fond | `rgba(255,255,255,0.03)` + blur |
| Bordure | Indigo 25% |
| Texte | `#d4d4d8` → blanc au hover |

**Dashboard** :

```html
<button
  type="button"
  class="rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"
>
  Annuler
</button>
```

**Bouton danger** :

```html
class="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
```

**Bouton succès** :

```html
class="rounded-lg border border-green-500/30 px-2 py-1 text-xs text-green-300 hover:bg-green-500/10"
```

---

### 3. Input

**Classe globale** `.input` (`app/globals.css`) — **obligatoire** pour texte, email, mot de passe, textarea.

```html
<input class="input" type="email" placeholder="Email" />
<textarea class="input resize-none" rows="3" />
```

| Propriété | Valeur |
|-----------|--------|
| Fond | `rgba(255,255,255,0.05)` |
| Bordure | `rgba(255,255,255,0.1)` |
| Radius | `0.75rem` (`rounded-xl`) |
| Focus | `border-color: #7c3aed` |
| Placeholder | `rgba(255,255,255,0.3)` |

**Login mobile** : ajouter `.login-field` (font-size 16px anti-zoom iOS).

**Ne pas utiliser** : `<input>` sans classe `.input` ou équivalent documenté.

---

### 4. Select (dropdown)

**Composant obligatoire** : `components/ui/custom-select.tsx`

```tsx
import { CustomSelect } from "@/components/ui/custom-select";

<CustomSelect
  label="Canal principal"
  value={value}
  onChange={setValue}
  placeholder="Sélectionner…"
  options={[
    { value: "snapchat", label: "Snapchat" },
    { value: "telegram", label: "Telegram" },
  ]}
/>
```

| Élément | Style |
|---------|--------|
| Trigger | `bg-[#06080f]`, `border-violet-500/50`, texte blanc |
| Focus | `ring-2 ring-violet-500/40` |
| Panel | `bg-[#090B14]`, bordure violette, glow, portail `fixed` |
| Option hover | `bg-violet-600/20` |
| Option sélectionnée | `bg-violet-600/15` + icône Check |
| Tailles | `size="md"` (défaut) · `size="sm"` (tableaux, compact) |

**Groupes d’options** : prop `groups` pour listes catégorisées.

**Interdit** : `<select>` natif HTML.

---

### 5. Modal

Pattern standard (admin, produits, import rapide) :

```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <!-- Overlay -->
  <div class="absolute inset-0 bg-black/60" aria-hidden="true" />
  <!-- Panel -->
  <div
    role="dialog"
    aria-modal="true"
    class="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1117] p-6"
  >
    <h3 class="text-lg font-bold">Titre</h3>
    <p class="mt-1 text-sm text-white/50">Description</p>
    <!-- contenu -->
    <div class="mt-5 flex gap-3">
      <button class="flex-1 rounded-xl bg-violet-600 py-2.5 font-semibold hover:bg-violet-500">
        Confirmer
      </button>
      <button class="flex-1 rounded-xl border border-white/10 py-2.5 hover:bg-white/5">
        Annuler
      </button>
    </div>
  </div>
</div>
```

| Propriété | Valeur |
|-----------|--------|
| Overlay | `bg-black/60` |
| Panel | `bg-[#0f1117]`, `rounded-2xl`, `border-white/10` |
| z-index | `z-50` |
| Largeur | `max-w-md` (formulaire) · `max-w-lg` (contenu riche) |

Fermeture : clic overlay + bouton Annuler. Focus trap recommandé pour nouvelles modales.

---

### 6. Card KPI

Utilisée dans admin dashboard et vue d’ensemble.

```html
<div class="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
  <div class="mb-3 flex items-center justify-between">
    <span class="text-xs uppercase tracking-wide text-white/40">Label KPI</span>
    <Icon class="text-white/30" size="18" />
  </div>
  <p class="text-2xl font-bold">1 234</p>
</div>
```

Grille KPI :

```html
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <!-- cards -->
</div>
```

---

### 7. Tableau

Pattern admin / listes data.

```html
<div class="overflow-hidden rounded-2xl border border-white/10">
  <div class="border-b border-white/10 px-5 py-4">
    <h2 class="text-lg font-bold">Titre ({count})</h2>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[960px] text-left text-sm">
      <thead class="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
        <tr>
          <th class="px-4 py-3">Colonne</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t border-white/5 hover:bg-white/[0.02]">
          <td class="px-4 py-3">Valeur</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

### 8. Badge statut

Pills arrondis, fond semi-transparent + texte coloré.

| Statut | Classes |
|--------|---------|
| Actif / succès | `bg-green-500/15 text-green-300` |
| En attente | `bg-amber-500/15 text-amber-300` |
| Invité / info | `bg-blue-500/15 text-blue-300` |
| Suspendu / erreur | `bg-red-500/15 text-red-300` |
| Expiré | `bg-amber-500/15 text-amber-300` |
| Plan / tag | `bg-violet-500/15 text-violet-200` |

Structure :

```html
<span class="rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-300">
  Actif
</span>
```

Référence : `components/admin/admin-dashboard.tsx` (`STATUS_BADGE`, `WAITLIST_STATUS_BADGE`).

---

### 9. Menu latéral (dashboard)

Composant : `components/dashboard/dashboard-nav.tsx`

| Zone | Style |
|------|--------|
| Container | `bg-[#06080f]`, `border-white/[0.06]`, `md:w-64`, `md:h-screen` |
| Lien inactif | `text-white/60 hover:bg-white/5 hover:text-white` |
| Lien actif | `bg-violet-600/20 text-violet-200` |
| Item | `rounded-xl px-3 py-2.5 text-sm font-medium` |
| Mobile | Onglets horizontaux scrollables (`.dashboard-tabs`) |
| Safe area | `.dashboard-nav` + `env(safe-area-inset-top)` |

Layout dashboard : `app/dashboard/layout.tsx` — fond `bg-[#030712]`.

---

## Layout page (dashboard)

```html
<main class="p-4 sm:p-6 md:p-10">
  <h1 class="text-3xl font-extrabold tracking-tight">Titre</h1>
  <p class="mt-1 mb-8 text-white/50">Sous-titre</p>
  <!-- contenu -->
</main>
```

---

## Messages & feedback

| Type | Style |
|------|--------|
| Succès | `rounded-xl bg-green-500/10 px-3 py-2 text-sm text-green-300` |
| Erreur | `rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300` |
| Info | `rounded-xl bg-white/5 px-3 py-2 text-sm text-white/70` |
| Loading | `text-white/60` + icône `Loader2 animate-spin` |

---

## Icônes

- **Bibliothèque** : [Lucide React](https://lucide.dev) (`lucide-react`)
- **Taille nav** : 17–22px
- **Couleur inactive** : `text-white/30` – `text-white/60`
- **Couleur accent** : `text-violet-300` – `text-violet-400`

---

## Checklist nouvelle page

Avant merge, vérifier :

- [ ] Fond `#030712` ou surface documentée
- [ ] Aucun `<select>` natif → `CustomSelect`
- [ ] Inputs avec classe `.input`
- [ ] Boutons primaire / secondaire conformes
- [ ] Cards `rounded-2xl border border-white/10 bg-white/[0.02]`
- [ ] Modales avec overlay + panel `#0f1117`
- [ ] Badges statut selon la table ci-dessus
- [ ] Focus violet visible sur éléments interactifs
- [ ] Cibles tactiles ≥ 44px sur mobile

---

## Fichiers de référence

| Composant | Fichier |
|-----------|---------|
| Tokens & CTA & input | `app/globals.css` |
| Select custom | `components/ui/custom-select.tsx` |
| Sidebar dashboard | `components/dashboard/dashboard-nav.tsx` |
| KPI + table + badges | `components/admin/admin-dashboard.tsx` |
| Modal exemple | `components/admin/admin-dashboard.tsx` (edit subscription) |
| Page auth | `app/login/page.tsx`, `app/waitlist/page.tsx` |

---

## Évolution prévue

Composants à extraire dans `components/ui/` pour homogénéiser :

- `Button` (primary / secondary / danger)
- `Input` / `Textarea`
- `Modal`
- `KpiCard`
- `DataTable`
- `StatusBadge`
- `Sidebar` ( générique )

En attendant, **copier les patterns de ce document** — ne pas inventer de nouveaux styles.

---

*Dernière mise à jour : juin 2026 — Catalink v0.1*
