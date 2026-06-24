import {
  BarChart3,
  ClipboardList,
  LayoutGrid,
  MessageSquare,
  Share2,
  Smartphone,
  Store,
  Upload,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";

const FEATURES = [
  {
    icon: Store,
    title: "Boutique professionnelle",
    desc: "Un lien public à ton nom, avec une vitrine claire pour tes clients.",
  },
  {
    icon: LayoutGrid,
    title: "Catalogue produits",
    desc: "Photos, prix et catégories — fini les réponses répétées en DM.",
  },
  {
    icon: ClipboardList,
    title: "Commandes centralisées",
    desc: "Toutes tes ventes au même endroit, avec statuts et historique.",
  },
  {
    icon: Users,
    title: "Suivi client",
    desc: "Retrouve facilement qui a commandé quoi, et quand.",
  },
  {
    icon: Share2,
    title: "Hub social",
    desc: "Prépare et organise ton contenu pour tes réseaux depuis le dashboard.",
  },
  {
    icon: MessageSquare,
    title: "Réponses rapides",
    desc: "Des messages types pour répondre vite aux questions fréquentes.",
  },
  {
    icon: Upload,
    title: "Import rapide",
    desc: "Ajoute plusieurs produits d'un coup pour lancer ta boutique plus vite.",
  },
  {
    icon: Smartphone,
    title: "Dashboard mobile",
    desc: "Gère ta boutique et tes commandes depuis ton téléphone.",
  },
];

export function LandingFeatures() {
  return (
    <section id="fonctionnalites" className="py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          label="Fonctionnalités"
          title="Tout ce qu'il faut pour vendre proprement"
          description="Des outils concrets pour passer du chaos des messages à un vrai système de vente."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="gradient-border rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--surface)" }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    background: "rgba(99,102,241,.12)",
                    borderColor: "rgba(99,102,241,.2)",
                  }}
                >
                  <Icon size={20} className="text-violet-300" />
                </div>
                <h3 className="mb-2 font-bold text-zinc-100">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
