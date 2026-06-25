# Système de Design — Libreville Eats

> Document de référence design. Toute évolution visuelle de l'app (couleur, typo,
> composant) se justifie par rapport à ce fichier ou le met à jour explicitement.

---

## 0. Pourquoi cette refonte

### Audit du système actuel

Le système précédent (palette Vert Équatorial unique, Fraunces + Geist, cartes
sobres) est **techniquement propre** mais souffre d'un problème de fond pour une
app de livraison de repas :

| Critère (refactoring-ui / web-typography) | Score | Constat |
|---|---|---|
| Hiérarchie visuelle | 7/10 | Correcte, mais aucun élément ne crée d'urgence ou d'appétit |
| Espacement & grille | 8/10 | Solide, déjà conforme à l'échelle 4/8/16/24/32/48/64 |
| **Couleur** | **4/10** | 1 seul accent vert (règle stricte « pas de secondaire ») → aucune couleur n'évoque la nourriture, l'appétit ou l'urgence d'achat. Le vert seul lit comme « écologique / fintech », pas comme « gourmand ». |
| Typographie | 7/10 | Fraunces + Geist est un bon pairing (contraste serif/sans), mais sous-exploité : utilisé avec trop de retenue pour porter une émotion |
| **Imagerie** | **3/10** | Les cartes restaurant prévoient une `<Image>` mais le repli est un dégradé abstrait bleu/orange — aucune direction art sur la photo, qui est pourtant le levier n°1 d'appétit dans ce secteur |
| Profondeur & ombres | 7/10 | `shadow-soft`/`shadow-card` bien dosées |
| Layout & composition | 7/10 | Grilles asymétriques déjà en place, bon point de départ |

**Diagnostic central :** ce n'est pas un problème de compétence d'exécution (le
système est cohérent), c'est un problème de **psychologie de la couleur**. Une
seule teinte verte, utilisée avec parcimonie volontaire, ne déclenche aucune
réponse d'appétit. Les apps de livraison qui « donnent envie de commander »
(Glovo, Just Eat, Swiggy, Deliveroo dans une moindre mesure) s'appuient toutes
sur une couleur chaude dominante (orange, rouge, jaune) — psychologiquement
associée à la faim, l'urgence et le plaisir immédiat — jamais sur du vert seul.

---

## 1. Brainstorming — 3 directions

### Direction A — « Marché Nocturne » (rejetée)
Fond sombre par défaut, accent néon (corail fluo ou magenta), forte énergie
« street food / clubbing ». **Rejetée** : trop tendance/éphémère, lisible comme
nightlife plutôt que confort alimentaire ; risque d'incohérence avec un usage
diurne (déjeuner) qui représente une grosse part du trafic livraison.

### Direction B — « Soleil de Libreville » (candidate)
Abandon du vert comme accent principal. Orange mangue/papaye en couleur
dominante, vert relégué à une touche décorative mineure. Très fort en appétit,
mais **dilue l'identité locale déjà construite** (le vert équatorial est la
seule référence explicite au Gabon dans le système actuel — drapeau, forêt).
Risque de ressembler à n'importe quelle app de livraison générique.

### Direction C — « Mangue & Forêt » (retenue)
On **garde le vert comme signature locale** (badges « Ouvert », confiance,
succès, identité Gabon) mais on **promeut une couleur chaude — Mangue —
au rang de couleur d'action principale** : c'est elle qui porte les prix, les
notes, les CTA (« Ajouter », « Commander »), les badges promo. Le vert ne
disparaît pas, il change de rôle : de « seul accent » à « accent de confiance »,
pendant que le Mangue devient « accent d'envie / d'action ».

C'est le schéma qu'utilisent implicitement la plupart des leaders du secteur :
une couleur chaude pour l'appétit/l'action, une couleur froide ou verte pour la
confiance/le statut (Uber Eats : noir + vert clignotant sur les statuts ;
Swiggy : orange + détails verts sur "livré"). On l'adapte à l'identité Gabon
déjà posée plutôt que de la jeter.

---

## 2. Validation de la direction retenue

**Critères de décision :**

| Critère | A. Marché Nocturne | B. Soleil de Libreville | C. Mangue & Forêt |
|---|---|---|---|
| Déclenche l'appétit | Moyen (énergie, pas faim) | Fort | Fort |
| Préserve l'identité Gabon construite | Faible | Faible | **Forte** |
| Différenciation vs apps génériques | Forte mais hors-sujet | Faible (orange = code commun du secteur) | **Forte** (combo orange+vert local rare) |
| Risque de migration (composants déjà écrits) | Élevé (dark-first) | Moyen | **Faible** (changement de rôle, pas de structure) |
| Accessibilité (contraste) | Risque élevé (néon sur sombre) | Faible risque | **Faible risque** |

**Décision : Direction C — « Mangue & Forêt ».** Elle résout le problème
diagnostiqué (aucune couleur d'appétit) sans détruire le travail déjà fait
(typographie, layout, motion, identité Gabon), et sans copier un code visuel
déjà saturé dans le secteur (orange seul).

**Typographie — validation séparée :** Fraunces + Geist Variable est gardé
*tel quel* comme paire de polices (pas de remplacement). Justification :
Fraunces a un caractère « doux/organique » par construction (axe optique
`opsz`) qui se prête naturellement à un univers culinaire — il est déjà
utilisé par de nombreuses marques food/beverage indépendantes pour cette
raison. Le problème n'était pas le choix de police mais son **sous-emploi** :
poids et tailles trop timides pour porter une émotion. On garde la paire, on
augmente l'amplitude d'utilisation (voir §4).

---

## 3. Palette Chromatique

### Mangue — nouvel accent principal (action, appétit, prix, notes)

| Token | OKLCH | Usage |
|---|---|---|
| `--color-mango-50` | `oklch(97% 0.025 75)` | Fond de bannière promo très clair |
| `--color-mango-100` | `oklch(94% 0.05 70)` | Fond de badge promo |
| `--color-mango-200` | `oklch(88% 0.08 65)` | Hover de surface chaude |
| `--color-mango-300` | `oklch(81% 0.12 60)` | Bordure d'accent légère |
| `--color-mango-400` | `oklch(74% 0.16 55)` | Icônes d'accent, étoiles |
| **`--color-mango-500`** | **`oklch(67% 0.19 48)`** | **CTA primaire, prix, badge TOP/PROMO** |
| `--color-mango-600` | `oklch(59% 0.19 40)` | Pressed / hover du CTA |
| `--color-mango-700` | `oklch(50% 0.17 34)` | Texte sur fond mango-50/100 |
| `--color-mango-800` | `oklch(41% 0.14 30)` | — |
| `--color-mango-900` | `oklch(32% 0.11 28)` | Texte d'encre sur fond mango clair |

Règle (héritée du système précédent, toujours valable) : **jamais de blanc pur
sur Mangue** — toujours `mango-900` (encre chaude) sur fond `mango-500/400`,
contraste ≥ 7:1 vérifié.

### Forêt — accent secondaire (confiance, statut positif, identité Gabon)

| Token | OKLCH | Usage |
|---|---|---|
| `--color-forest-100` | `oklch(93% 0.05 155)` | Fond badge "Ouvert" |
| `--color-forest-500` | `oklch(58% 0.15 155)` | Badge "Ouvert", coche vérifié, succès |
| `--color-forest-600` | `oklch(49% 0.13 155)` | Pressed |
| `--color-forest-900` | `oklch(20% 0.045 155)` | Texte sur fond forest clair |

*(Légèrement désaturé par rapport à l'ancien `--color-accent` pour ne plus
jamais entrer en compétition visuelle avec Mangue — le vert doit maintenant
se lire comme « statut », pas comme « bouton ».)*

### Promo — distinct du Mangue pour éviter la confusion CTA/promo

| Token | OKLCH | Usage |
|---|---|---|
| `--color-promo` | `oklch(86% 0.15 92)` | Bannières « offre du jour », jamais sur un bouton d'action |

*(Décalé vers un jaune plus doré que l'orange Mangue — au premier coup d'œil,
un badge promo et un bouton « Commander » ne doivent jamais se confondre.)*

### Neutres & erreur

| Token | OKLCH | Usage |
|---|---|---|
| `--color-paper` | `oklch(100% 0 0)` | Fond principal |
| `--color-paper-2` | `oklch(96.5% 0.006 75)` | Cartes — *gris légèrement réchauffé (hue 75, plus proche de Mangue que l'ancien hue 100), cohérent avec le nouveau ton chaud* |
| `--color-ink` | `oklch(22% 0.01 75)` | Texte principal |
| `--color-ink-2` | `oklch(52% 0.005 75)` | Texte secondaire |
| `--color-error` | `oklch(56% 0.21 18)` | Erreurs — *hue éloigné du Mangue (18 vs 48) pour ne jamais être lu comme une variante du CTA* |
| `--color-soft` (bleu) | `oklch(96% 0.04 240)` | Bannières douces, abonnement Plus — inchangé, contrepoint froid volontaire |

**Règle mise à jour :** 2 accents autorisés (Mangue = action/appétit, Forêt =
confiance/statut), jamais un troisième. Pas de violet/bleu néon. Mangue et
Forêt ne se substituent jamais l'un à l'autre dans le même rôle.

---

## 4. Architecture Typographique (confirmée, usage recalibré)

- **Affichage / Titres :** `Fraunces`, axe optique `opsz` poussé vers 144 sur
  les tailles héro (≥ 36px) pour exploiter son grain « doux/organique ».
  Graisses 600/700/**900** (le 900 était inutilisé — réservé au hero et aux
  prix vedettes). Italique Fraunces autorisé pour les accroches courtes
  (« Plat du jour », notes de chef) — reste dans la même famille, donc
  toujours « 2 polices max ».
- **Corps :** `Geist Variable`, inchangé. Interlignage 1.5–1.7, largeur max
  65 caractères.
- **Mono :** `IBM Plex Mono`, inchangé — prix FCFA, notes, timestamps,
  `font-variant-numeric: tabular-nums`.
- **Échelle (inchangée, déjà conforme 1.25)** : 12/14/16/20/24/30/36/`display`.
- **Nouveau levier :** la **couleur** Mangue rejoint taille et graisse comme
  3ᵉ levier de hiérarchie sur les éléments transactionnels (prix, CTA) —
  jusqu'ici la hiérarchie ne jouait que sur taille/graisse/gris.

---

## 5. Composants — patterns spécifiques livraison de repas

### Carte restaurant / plat
- Photo en `aspect-[4/3]` minimum, `object-cover`, jamais de repli en
  dégradé abstrait — repli = photo de plat générique locale (riz/poisson/
  poulet nyembwe), jamais une icône ou un dégradé.
- Badge « Ouvert » → `forest-500/forest-100` (confiance/statut).
- Badge « PROMO » / « TOP » → `mango-500` (action/envie) — **ne plus
  utiliser le vert pour ces deux badges**, c'était la même couleur que
  « Ouvert » et cassait la hiérarchie sémantique.
- Prix et note : `font-mono`, `tabular-nums`, couleur `mango-700` pour le
  prix (élément qui doit accrocher l'œil), gris pour le libellé.

### Boutons
- **Primaire (« Ajouter », « Commander »)** : pilule, fond `mango-500`,
  texte `mango-900`, retour tactile `scale(0.98)` + `mango-600` au clic.
- **Secondaire** : inchangé (bordure, fond toile) — devient `mango` au hover
  au lieu de `forest`.
- **Statut/confirmation (« Ouvert », « Vérifié »)** : seule famille de
  boutons/badges autorisée à utiliser `forest`.

### Suivi de commande (timeline de statut)
Reflète directement la machine à états backend
(`PENDING → CONFIRMED → PREPARING → READY_FOR_DELIVERY →
DELIVERY_IN_PROGRESS → DELIVERED`) :
- Étapes franchies : trait et pastille `forest-500` (confiance, c'est fait).
- Étape en cours : pastille `mango-500` avec `pulse-ring` (déjà défini dans
  `globals.css`) — l'attente active doit être chaude, pas neutre.
- Étapes à venir : gris `ink-2` à 40 % d'opacité.

### Panier
- Badge de comptage : `pulse-ring` existant, recoloré en `mango-500`
  (c'était vert — l'ajout au panier est un moment d'envie, pas de confiance).
- Micro-interaction « ajouté » : `scale` + `fade-in-up` existants, déclenchés
  sur incrément du compteur.

### États vides
- Toujours une illustration simple liée à la nourriture (assiette vide,
  panier vide stylisé) + CTA — jamais de texte seul (règle déjà en place,
  confirmée).

---

## 6. Layout, Mouvement, Anti-patterns

**Inchangés** par rapport au système précédent — ils n'étaient pas la cause du
problème diagnostiqué en §0 :
- Grille CSS d'abord, conteneur `max-w-6xl`, collapse mobile total < 768px,
  pas de scroll horizontal involontaire, pas de 3 colonnes égales en rangée
  (zigzag/asymétrie à la place).
- Spring physics `cubic-bezier(0.34, 1.56, 0.64, 1)`, révélation en cascade,
  `prefers-reduced-motion` respecté, uniquement `transform`/`opacity` animés.
- Anti-patterns inchangés : pas d'émoji, pas de noir pur, pas d'ombre néon,
  pas de dégradé violet/bleu « IA », pas de texte en dégradé sur les titres,
  pas de curseur personnalisé, pas de Lorem Ipsum, pas de noms génériques.
- **Ajout :** pas de photo de plat étirée ou recadrée au centre par défaut —
  recadrage délibéré sur l'élément principal de l'assiette.

---

## 7. Cible de score (post-refonte)

| Critère | Avant | Cible |
|---|---|---|
| Hiérarchie visuelle | 7/10 | 9/10 |
| Espacement & grille | 8/10 | 8/10 (déjà bon) |
| Couleur | 4/10 | 9/10 |
| Typographie | 7/10 | 9/10 |
| Imagerie | 3/10 | 8/10 *(plafonné — dépend de vraies photos plats, pas seulement du système)* |
| Profondeur & ombres | 7/10 | 7/10 (déjà bon) |
| Layout & composition | 7/10 | 8/10 |

---

## 8. Mise en œuvre — diff attendu

Ce document est la référence ; l'implémentation technique correspondante
(non appliquée par ce fichier) touchera :

- `tokens.css` : remplacer `--color-accent*` par `--color-mango-*` (10
  nuances) + `--color-forest-*` (4 nuances) ; réchauffer le hue des gris
  neutres de 100 → 75 ; recalculer `--color-error` (hue 18).
- `tailwind.config.ts` : exposer `mango` et `forest` comme palettes
  complètes (50–900) au lieu d'un unique `brand`.
- Composants impactés en priorité : `RestaurantsPageClient.tsx` (badges
  Ouvert/PROMO/TOP), `CartDrawer.tsx` (badge panier), page détail commande
  (timeline de statut), `globals.css` (recolorer `pulse-ring`).

*(Prochaine étape proposée, hors scope de ce document : appliquer ce diff.)*
