# Système de Design — Libreville Eats

## 1. Ambiance Visuelle & Atmosphère

Application quotidienne équilibrée (Densité 5), à la confiance asymétrique (Variance 7)
et au mouvement fluide (Motion 6). L'atmosphère est chaleureuse, locale et verdoyante —
inspirée de Libreville, de ses quartiers et de sa forêt équatoriale. Le design respire
la confiance tranquille : rien ne crie, tout a sa place. Le Vert Équatorial unique
(#00A859) ancre l'identité sans jamais dominer.

## 2. Palette Chromatique & Rôles

- **Blanc Papier** (#FFFFFF) — Fond principal, pureté de la toile.
- **Surface Chaude** (#F4F4F2) — Cartes, tuiles, fonds de sections secondaires.
- **Surface Enfoncée** (#EAEAE8) — État pressé, hover des surfaces, champs.
- **Encre Profonde** (#1D1D1B) — Texte principal, titres, données importantes.
- **Acier Discret** (#6B6B6B) — Texte secondaire, métadonnées, descriptions.
- **Trait Fin** (#E8E8E6) — Bordures, séparateurs, lignes structurelles (1px).
- **Vert Équatorial** (#00A859) — Accent unique. Boutons, étoiles, badges, focus rings.
- **Vert Pressé** (#008A49) — État actif/enfoncé des contrôles verts.
- **Vert Encre** (#002B16) — Texte sur fond vert. Jamais de blanc sur vert.
- **Jaune Équateur** (#FFD100) — Promotions uniquement, utilisé avec parcimonie.
- **Bleu Estuaire** (#E0F4FF) — Fonds de bannières douces, abonnement Plus.
- **Erreur Rouge** (#E2483D) — Erreurs de formulaire, échecs de paiement.

**Règle stricte :** 1 seul accent (Vert Équatorial). Pas de secondaire. Pas de violet/bleu néon.
Les gris sont teintés chaud (hue 100 en OKLCH) — pas de fluctuation warm/cool.

### Mode Sombre (.dark)

- Toile (#121212), Surface 1 (#1C1C1E), Surface 2 (#262629)
- Texte Principal (#F4F4F2), Texte Secondaire (#9E9E9E)

## 3. Architecture Typographique

- **Affichage / Titres :** `Fraunces` (graisses 500, 600, 700) — Serif moderne distinctif,
  track-tight, hiérarchie gérée par le poids et la couleur, pas uniquement la taille.
- **Corps :** `Geist Variable` (graisses 400–900) — Sans-serif technique et professionnel.
  Interlignage relâché, largeur max 65 caractères par ligne.
- **Mono :** `IBM Plex Mono` (graisses 400, 500) — Pour les données tabulaires,
  les prix FCFA, les timestamps.
- **Interdit :** `Inter` (banni pour contexte premium). Polices serif génériques
  (Times New Roman, Georgia, Garamond, Palatino) bannies. Serif réservé aux titres
  via Fraunces uniquement.

## 4. Stylisation des Composants

### Boutons
- **Primaire :** Pilule arrondie (999px), fond Vert Équatorial, texte Vert Encre, gras 800.
  Retour tactile : `scale(0.98)` et fond Vert Pressé au clic.
  Pas de lueur extérieure, pas de neon, pas de curseur personnalisé.
- **Secondaire :** Bordure Trait Fin, fond toile, texte Encre.
  Devient bordure verte au hover.
- **Texte/Lien :** Simple texte Vert Équatorial, pas de fond, pas de souligné par défaut.
- **Désactivé :** Opacité 70%, curseur not-allowed.

### Cartes
- Coins arrondis (1rem), ombre teintée (`oklch(0% 0 0 / 0.06)`), bordure fine.
- Utilisées UNIQUEMENT quand l'élévation sert la hiérarchie.
- Pas de fond blanc pur sur fond blanc — utiliser Surface Chaude pour distinguer.

### Champs de saisie
- Label au-dessus, texte d'aide optionnel, message d'erreur en dessous.
- Coins arrondis (0.875rem), bordure Trait Fin.
- Focus ring : Vert Équatorial à 20% d'opacité.
- Pas de floating labels.

### États de chargement
- Squelettes (skeletons) aux dimensions exactes du layout.
- Pas de spinners circulaires génériques.
- Animation `pulse` subtile.

### États vides
- Composition illustrée indiquant comment remplir les données.
- Pas de simple texte « Aucune donnée ».

## 5. Principes de Layout

- **Grille d'abord :** CSS Grid plutôt que Flexbox mathématique.
  Pas de `calc()` percentage hacks.
- **Conteneur max-width :** 1152px (max-w-6xl), centré avec marges auto.
- **Sections pleine hauteur :** `min-h-[100dvh]` — jamais `h-screen`
  (corrige le saut catastrophique sur iOS Safari).
- **Collapse mobile <768px :** Toutes les grilles multi-colonnes passent en
  colonne unique. Aucune exception.
- **Pas de scroll horizontal :** Le débordement horizontal sur mobile est
  une défaillance critique.
- **Pas d'éléments superposés :** Chaque élément occupe sa propre zone spatiale
  claire. Pas de position:absolute empilé.
- **Les 3 colonnes égales de cartes en rangée sont INTERDITES :**
  Utiliser grille 2-col en zigzag, grille asymétrique, ou scroll horizontal à la place.
- **Padding généreux :** Espacement vertical des sections via `clamp(3rem, 8vw, 6rem)`.

## 6. Mouvement & Interactions

- **Spring Physics :** `cubic-bezier(0.34, 1.56, 0.64, 1)` pour les transitions
  interactives — sensation de poids naturelle.
- **Réévélation en cascade :** Les listes et grilles se dévoilent avec des délais
  progressifs. Jamais de montage instantané.
- **Micro-interactions perpétuelles :** Icônes de features en `float` infini,
  badge panier en `pulse-ring` subtil.
- **Performance :** Uniquement `transform` et `opacity` pour les animations.
  Jamais `top`, `left`, `width`, `height`.
- **Respect des préférences :** `prefers-reduced-motion` désactive toutes les animations.

## 7. Anti-Patterns (Interdits)

- **Aucun émoji** dans l'interface.
- **Inter** banni pour les textes d'interface.
- **Noir pur** (#000000) interdit — utiliser Encre Profonde (#1D1D1B) ou Charbon.
- **Ombres néon / lueur extérieure** interdites.
- **Dégradé violet/bleu « AI »** interdit.
- **Texte en dégradé sur les grands titres** interdit.
- **Curseur personnalisé** interdit.
- **3 colonnes égales de cartes** en rangée interdites.
- **Noms génériques** (« John Doe », « Acme Corp », « SmartFlow ») interdits.
- **Chiffres ronds faux** (99.99%, 50%, .00) interdits — utiliser des données organiques.
- **Expressions AI bateau :** « Elevate », « Seamless », « Unleash », « Next-Gen »,
  « Game-changer », « Dans l'univers de... » interdites.
- **Texte de remplissage :** « Scroll to explore », « Swipe down », flèches de scroll,
  chevrons rebondissants interdits.
- **Liens Unsplash cassés :** Utiliser picsum.photos ou SVG.
- **Lorem Ipsum** interdit — toujours du texte rédactionnel réel.
