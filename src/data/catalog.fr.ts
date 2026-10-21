// Teresa & Sons — the catalog in Canadian French. These are the resource translations Shopify's Translate & Adapt
// holds per product, collection and metafield: titles, taglines, descriptions and spec values. Slugs, prices and the
// English names the try-on and costing heuristics read stay in catalog.ts.
import type { CategorySlug, Metal, Product, ProductType } from './catalog'

export interface CategoryFr {
  name: string
  /** The italic accent beside the name. English shows the French name there; French gives each chapter its own line. */
  accent: string
  description: string
}

export const CATEGORY_FR: Record<CategorySlug, CategoryFr> = {
  necklaces: { name: 'Colliers', accent: 'près du cœur', description: 'Pendentifs, rivières et chaînes dessinés dans l’or 18 carats, portés près du cœur.' },
  earrings: { name: 'Boucles d’oreilles', accent: 'la lumière du fleuve', description: 'Boutons, pendants et mini-anneaux qui captent la lumière du Saint-Laurent.' },
  bracelets: { name: 'Bracelets', accent: 'à superposer', description: 'Bracelets tennis, manchettes et joncs, faits pour se superposer et se transmettre.' },
  rings: { name: 'Bagues', accent: 'finies à la main', description: 'Chevalières, bagues cocktail et anneaux de tous les jours, finis à la main dans notre atelier.' },
  bridal: { name: 'Joaillerie de mariage', accent: 'pour la vie', description: 'Bagues de fiançailles certifiées GIA et alliances, pour une vie de promesses.' },
  watches: { name: 'Montres', accent: 'l’heure suisse', description: 'Une sélection de garde-temps suisses, entretenus par notre horloger.' },
  rentals: { name: 'Location de bijoux', accent: 'le temps d’un soir', description: 'De la haute joaillerie pour les galas, les mariages et les premières — assurée, livrée, reprise.' },
  gifts: { name: 'Cadeaux', accent: 'à offrir', description: 'Des pièces choisies avec soin, présentées dans notre écrin travertin signature.' },
  custom: { name: 'Sur mesure et personnalisé', accent: 'à votre image', description: 'Du croquis au serti — créations sur mesure et bijoux de famille gravés.' },
}

export const METAL_FR: Record<Metal, string> = {
  '18k-yellow': 'Or jaune 18 carats',
  '18k-white': 'Or blanc 18 carats',
  '18k-rose': 'Or rose 18 carats',
  platinum: 'Platine 950',
  vermeil: 'Vermeil',
}

export const BADGE_FR: Record<NonNullable<Product['badges']>[number], string> = {
  New: 'Nouveauté',
  Bestseller: 'Incontournable',
  'Atelier Exclusive': 'Exclusivité atelier',
  Limited: 'Édition limitée',
  'Made to Order': 'Sur commande',
}

/** Piece types, plural, as the chapter filters show them. */
export const TYPE_FR: Record<ProductType, string> = {
  engagement: 'Bagues de fiançailles',
  band: 'Alliances',
  eternity: 'Anneaux d’éternité',
  'tennis-necklace': 'Colliers tennis',
  riviere: 'Rivières',
  collar: 'Colliers de soirée',
  pendant: 'Pendentifs',
  chain: 'Chaînes',
  nameplate: 'Colliers prénom',
  studs: 'Boutons d’oreilles',
  drops: 'Pendants d’oreilles',
  huggies: 'Mini-anneaux',
  chandelier: 'Pendants chandelier',
  'tennis-bracelet': 'Bracelets tennis',
  cuff: 'Manchettes',
  'chain-bracelet': 'Bracelets chaîne',
  signet: 'Chevalières',
  cocktail: 'Bagues cocktail',
  stacking: 'Joncs empilables',
  watch: 'Montres',
  set: 'Parures',
  commission: 'Créations sur mesure',
  redesign: 'Bijoux réinventés',
  'gift-card': 'Cartes-cadeaux',
}

/** Spec labels, keyed by the English label in catalog.ts. */
export const SPEC_LABEL_FR: Record<string, string> = {
  Chain: 'Chaîne',
  Clasp: 'Fermoir',
  'Total carat weight': 'Poids total',
  Color: 'Couleur',
  Clarity: 'Pureté',
  Length: 'Longueur',
  Link: 'Maille',
  Weight: 'Poids',
  Backs: 'Fermoirs',
  Pearl: 'Perle',
  Diamonds: 'Diamants',
  Diamond: 'Diamant',
  Diameter: 'Diamètre',
  Width: 'Largeur',
  Widths: 'Largeurs',
  Face: 'Plateau',
  Emerald: 'Émeraude',
  Band: 'Anneau',
  'Hidden halo': 'Halo caché',
  'Side stones': 'Pierres latérales',
  Profile: 'Profil',
  Case: 'Boîtier',
  Movement: 'Mouvement',
  'Water resistance': 'Étanchéité',
  Strap: 'Bracelet',
  Edition: 'Édition',
  Bezel: 'Lunette',
  Insurance: 'Assurance',
  Delivery: 'Livraison',
  Sapphires: 'Saphirs',
  Includes: 'Comprend',
  Disc: 'Disque',
  Denominations: 'Valeurs',
  Validity: 'Validité',
  Process: 'Étapes',
  Consultation: 'Consultation',
  Service: 'Service',
  Letters: 'Lettres',
  Option: 'Option',
  Setting: 'Serti',
  'Second stone': 'Seconde pierre',
}

/** GIA report wording: shapes and cut grades. */
export const GIA_FR: Record<string, string> = {
  'Round Brilliant': 'Brillant rond',
  Oval: 'Ovale',
  Emerald: 'Émeraude',
  Cushion: 'Coussin',
  Radiant: 'Radiant',
  Excellent: 'Excellente',
  'Excellent (polish & symmetry)': 'Excellente (poli et symétrie)',
}

export interface ProductFr {
  name: string
  tagline: string
  description: string
  collection?: string
  /** Spec values, keyed by the English spec label. */
  specs: Record<string, string>
  personalization?: { label: string; hint: string; accent?: string }
}

export const PRODUCT_FR: Record<string, ProductFr> = {
  // Colliers
  'mont-royal-solitaire-pendant': { name: 'Pendentif solitaire Mont-Royal', tagline: 'Un seul brillant rond, en suspens.', description: 'Un brillant rond certifié GIA flotte dans un panier à quatre griffes, sur une fine chaîne forçat réglable à 16 et 18 pouces.', specs: { Chain: 'Forçat de 1,1 mm, 16–18 po', Clasp: 'Anneau à ressort' } },
  'riviere-saint-laurent': { name: 'Rivière Saint-Laurent', tagline: 'Une rivière de diamants en dégradé.', description: 'Quatre-vingt-douze diamants ronds en dégradé, chacun serti dans son chaton, articulés pour couler comme l’eau.', specs: { 'Total carat weight': '12,40 ct', Color: 'F–G', Clarity: 'VS', Length: '16 po' } },
  'plateau-paperclip-chain': { name: 'Chaîne trombone Plateau', tagline: 'La maille de tous les jours.', description: 'De longues mailles en or massif, polies à la main, faites pour se superposer.', specs: { Link: '4,2 mm', Length: '18 po', Weight: '6,8 g' } },
  'redpath-tennis-necklace': { name: 'Collier tennis Redpath', tagline: 'Cent douze diamants, une seule ligne.', description: 'Des brillants ronds d’une même taille, chacun à quatre griffes, assemblés à la main pour que la ligne repose à plat sur la clavicule. Un fermoir à double sécurité la referme.', specs: { 'Total carat weight': '10,00 ct', Color: 'F–G', Clarity: 'VS', Length: '16 po' } },
  'drummond-graduated-tennis': { name: 'Collier tennis dégradé Drummond', tagline: 'Plus généreux au centre, plus léger au fermoir.', description: 'Des brillants ronds en dégradé, de 0,30 ct au centre à 0,05 ct au fermoir, pour que la ligne tombe comme un pendentif.', specs: { 'Total carat weight': '7,50 ct', Color: 'G', Clarity: 'VS–SI1', Length: '17 po' } },
  'peel-emerald-cut-line': { name: 'Collier ligne taille émeraude Peel', tagline: 'Des tailles à degrés, bout à bout.', description: 'Des diamants taille émeraude sertis d’est en ouest dans de fins chatons : une lumière plus calme que celle des brillants, comme une rangée de fenêtres au crépuscule.', specs: { 'Total carat weight': '12,80 ct', Color: 'E–F', Clarity: 'VVS–VS', Length: '16 po' } },

  // Boucles d’oreilles
  'vieux-port-diamond-studs': { name: 'Boutons d’oreilles diamants Vieux-Port', tagline: 'La paire classique, appariée à la main.', description: 'Deux diamants ronds certifiés GIA, appariés, en sertis martini à quatre griffes, avec fermoirs à vis.', specs: { 'Total carat weight': '1,00 ct (la paire)', Backs: 'À vis' } },
  'outremont-pearl-drops': { name: 'Pendants d’oreilles perles Outremont', tagline: 'La lumière des mers du Sud, tout en douceur.', description: 'Des perles dorées des mers du Sud, sous des calottes pavées de diamants.', specs: { Pearl: '11–12 mm, mers du Sud', Diamonds: '0,22 ct' } },
  'mile-end-huggies': { name: 'Mini-anneaux Mile End', tagline: 'Pavés, articulés, sans effort.', description: 'De petits anneaux articulés, bordés d’un micro-pavé de diamants.', specs: { Diameter: '12 mm', Diamonds: '0,18 ct' } },

  // Bracelets
  'westmount-tennis-bracelet': { name: 'Bracelet tennis Westmount', tagline: 'Cinquante diamants, une seule ligne.', description: 'Des diamants ronds sertis à quatre griffes, retenus par un fermoir à boîte à double sécurité.', specs: { 'Total carat weight': '5,00 ct', Color: 'G–H', Clarity: 'VS–SI1', Length: '7 po' } },
  'atwater-cuff': { name: 'Manchette Atwater', tagline: 'Sculptée, martelée, signée à la main.', description: 'Une manchette en or massif, texturée au marteau et signée à l’intérieur par l’artisan.', specs: { Width: '8 mm', Weight: '24 g' } },
  'griffintown-chain-bracelet': { name: 'Bracelet chaîne Griffintown', tagline: 'Des racines industrielles, tout en finesse.', description: 'Des mailles gourmette ponctuées d’un seul diamant serti clos.', specs: { Diamond: '0,10 ct', Length: '6,5–7,5 po' } },

  // Bagues
  'teresa-signet': { name: 'La chevalière Teresa', tagline: 'La bague de notre fondatrice, coulée à nouveau.', description: 'Une chevalière ovale modelée sur l’originale de Teresa, de 1962 — prête à recevoir un monogramme ou des armoiries.', collection: 'Héritage', specs: { Face: '12 × 10 mm', Weight: '9 g' }, personalization: { label: 'Monogramme', hint: 'Jusqu’à trois initiales, gravées à la main sur le plateau.' } },
  'sherbrooke-emerald-cocktail': { name: 'Bague cocktail émeraude Sherbrooke', tagline: 'Le vert de Colombie, encadré de lumière.', description: 'Une émeraude colombienne de 3,1 ct au cœur d’un halo de diamants ronds.', specs: { Emerald: '3,10 ct, Colombie, huilage mineur', Diamonds: '0,85 ct' } },
  'laurier-stacking-band': { name: 'Jonc empilable Laurier', tagline: 'Fin, lumineux, à empiler sans fin.', description: 'Un jonc de 1,6 mm, pavé en demi-tour.', specs: { Width: '1,6 mm', Diamonds: '0,15 ct' } },

  // Mariage
  'notre-dame-oval-solitaire': { name: 'Solitaire ovale Notre-Dame', tagline: 'Un serti cathédrale pour un ovale.', description: 'Un ovale certifié GIA s’élève d’un halo caché, sur un anneau en lame de couteau.', specs: { Band: 'Lame de couteau de 1,8 mm', 'Hidden halo': '0,12 ct' } },
  'basilique-emerald-cut-three-stone': { name: 'Trilogie Basilique', tagline: 'Passé, présent, avenir.', description: 'Une pierre centrale taille émeraude, flanquée de baguettes effilées.', specs: { 'Side stones': '0,48 ct, baguettes effilées' } },
  'promesse-wedding-band': { name: 'Alliance Promesse', tagline: 'Tout en confort, pour toujours.', description: 'Une alliance classique au profil confort, offerte en 2, 4 et 6 mm.', specs: { Widths: '2 / 4 / 6 mm', Profile: 'Confort' } },
  'bonsecours-round-solitaire': { name: 'Solitaire rond Bonsecours', tagline: 'Six griffes, un brillant rond.', description: 'Un brillant rond certifié GIA, tenu par six fines griffes au-dessus d’un anneau effilé : la bague par laquelle commencent la plupart des demandes.', specs: { Band: 'Effilé de 2,0 mm', Setting: 'Six griffes' } },
  'ville-marie-cushion': { name: 'Coussin Ville-Marie', tagline: 'Un carré tout en douceur, discrètement auréolé.', description: 'Un coussin allongé certifié GIA au-dessus d’un halo caché de micro-pavé, sur un anneau pavé qui capte la lumière de côté.', specs: { Band: 'Pavé de 1,9 mm', 'Hidden halo': '0,18 ct' } },
  'saint-louis-toi-et-moi': { name: 'Toi et Moi Saint-Louis', tagline: 'Deux pierres, une histoire.', description: 'Deux brillants ronds certifiés GIA, sertis côte à côte sur un anneau pavé fendu : un pour chacun de vous.', specs: { 'Second stone': '1,00 ct, rond, GIA', Band: 'Pavé fendu, 0,32 ct' } },
  'maisonneuve-radiant-solitaire': { name: 'Solitaire radiant Maisonneuve', tagline: 'L’éclat, au carré.', description: 'Une taille radiant certifiée GIA dans un panier à quatre griffes, avec une ligne de micro-pavé le long de l’anneau.', specs: { Band: 'Pavé de 1,8 mm', Setting: 'Quatre griffes' } },
  'lachine-eternity-band': { name: 'Anneau d’éternité Lachine', tagline: 'Des diamants tout autour.', description: 'Un cercle complet de brillants ronds, sertis à la main à griffes partagées, pour que l’anneau ne cesse jamais de capter la lumière.', specs: { 'Total carat weight': '2,20 ct', Width: '2,4 mm', Setting: 'Griffes partagées' } },

  // Montres
  'heritage-automatic-38': { name: 'Héritage Automatique 38', tagline: 'Mouvement suisse, réglé à Montréal.', description: 'Une automatique de 38 mm au cadran soleillé, réglée dans notre atelier.', collection: 'Sélection suisse', specs: { Case: '38 mm', Movement: 'Automatique suisse, réserve de marche de 42 h', 'Water resistance': '50 m', Strap: 'Alligator' } },
  'chronographe-1962': { name: 'Chronographe 1962', tagline: 'Pour l’année où nous avons ouvert nos portes.', description: 'Un chronographe en édition limitée de 62 pièces, au cadran panda.', collection: 'Sélection suisse', specs: { Case: '40 mm', Movement: 'Chronographe à remontage manuel', Edition: '62 pièces' } },
  'dame-du-lac': { name: 'Dame du Lac', tagline: 'Nacre et lunette de diamants.', description: 'Une petite montre à quartz, à la lunette sertie de diamants.', collection: 'Sélection suisse', specs: { Case: '30 mm', Movement: 'Quartz suisse', Bezel: '0,60 ct de diamants' } },

  // Location
  'gala-diamond-collar': { name: 'Collier de diamants Gala', tagline: 'Le tapis rouge, le temps d’une fin de semaine.', description: 'Un collier de 18 ct de diamants, entièrement assuré, livré par messager à Montréal, à Toronto et à New York.', collection: 'Le Coffre', specs: { 'Total carat weight': '18,20 ct', Insurance: 'Incluse', Delivery: 'Messager cautionné' } },
  'chandelier-sapphire-earrings': { name: 'Boucles d’oreilles chandelier saphirs', tagline: 'Le bleu de Ceylan, emprunté pour la soirée.', description: 'Une cascade de saphirs de Ceylan et de diamants.', collection: 'Le Coffre', specs: { Sapphires: '8,40 ct, Ceylan', Diamonds: '3,10 ct' } },
  'bridal-tiara-and-drops': { name: 'Parure de mariée, diadème et pendants', tagline: 'Quelque chose d’emprunté.', description: 'Un diadème de diamants et ses pendants d’oreilles assortis, ajustés dans notre salon.', collection: 'Le Coffre', specs: { Includes: 'Diadème, boucles d’oreilles, ajustement', Insurance: 'Incluse' } },

  // Cadeaux
  'initial-disc-pendant': { name: 'Pendentif disque à initiale', tagline: 'Une seule lettre, infiniment personnelle.', description: 'Un disque gravé à la main, sur une fine chaîne, présenté dans notre écrin travertin.', collection: 'Cadeaux à moins de 1 000 $', specs: { Disc: '12 mm', Chain: '16–18 po' }, personalization: { label: 'Initiale', hint: 'Une lettre, gravée à la main sur le devant du disque.' } },
  'pearl-stud-gift-set': { name: 'Coffret boutons d’oreilles perles', tagline: 'Des perles en écrin, nouées d’un ruban.', description: 'Des boutons d’oreilles en perles Akoya, avec chiffon de polissage et carte d’entretien.', collection: 'Cadeaux à moins de 1 000 $', specs: { Pearl: '7–7,5 mm, Akoya' } },
  'gift-card': { name: 'Carte-cadeau Teresa & Sons', tagline: 'Le plaisir de choisir.', description: 'Échangeable dans notre salon de Montréal et en ligne, en dollars canadiens ou américains.', collection: 'Cartes-cadeaux', specs: { Denominations: '250 $ – 10 000 $', Validity: 'Sans date d’expiration' } },

  // Sur mesure
  'bespoke-engagement-commission': { name: 'Bague de fiançailles sur mesure', tagline: 'Dessinée avec vous, dès la première esquisse.', description: 'Consultation privée, rendus 3D, modèle en cire et sertissage à la main. Le prix indiqué est un acompte de départ.', collection: 'Sur mesure', specs: { Process: 'Consultation → croquis → 3D → cire → serti', Consultation: 'Au salon ou en virtuel' } },
  'heirloom-redesign': { name: 'Bijou de famille réinventé', tagline: 'Des pierres anciennes, de nouvelles histoires.', description: 'Nous ressertissons et réinventons vos pierres et votre or de famille en une nouvelle pièce.', collection: 'Sur mesure', specs: { Includes: 'Évaluation, dessin, refonte', Service: 'Or récupéré lorsque possible' } },
  'engraved-nameplate-necklace': { name: 'Collier prénom gravé', tagline: 'Votre prénom, dans notre écriture.', description: 'Une plaque prénom découpée à la main, jusqu’à dix lettres, avec accent de diamant en option.', collection: 'Personnalisé', specs: { Letters: 'Jusqu’à 10', Option: 'Accent de diamant, +180 $' }, personalization: { label: 'Votre prénom', hint: 'Découpé à la main dans l’or massif. Lettres, espaces, traits d’union et apostrophes.', accent: 'Accent de diamant' } },
}

/** Gift-card design names. */
export const DESIGN_FR: Record<string, string> = {
  travertine: 'Travertin',
  espresso: 'Espresso',
  vermeil: 'Vermeil',
  'mont-royal': 'Mont-Royal',
}

/** Film titles and captions, keyed by video id (src/data/media.ts). */
export const VIDEO_FR: Record<string, { title: string; caption: string }> = {
  v5220: { title: 'L’ovale, de près', caption: 'Comment un ovale de 1,82 ct capte la lumière du matin.' },
  v47476: { title: 'Les préparatifs', caption: 'Une mariée attache son bracelet Westmount avant la cérémonie.' },
  v24656: { title: 'Le grand moment', caption: 'Chaque demande mérite cet instant.' },
  v34213: { title: 'La vitrine se pare', caption: 'Derrière la vitre, rue Sherbrooke.' },
  v34611: { title: 'Superposés, sans façon', caption: 'Bracelets tennis et mailles gourmettes, portés ensemble.' },
  v47288: { title: 'Quarante facettes plus tard', caption: 'Notre sertisseur vérifie chaque pierre à la loupe.' },
  v50782: { title: 'Le soir, paré', caption: 'Émeraude et perle pour un gala dans le Vieux-Montréal.' },
  v51649: { title: 'Oui, à Montréal', caption: 'Une demande au coin du feu, sur le mont Royal.' },
  v5181: { title: 'Promesses en écrin', caption: 'Des alliances assorties, prêtes pour le grand jour.' },
  v2861: { title: 'L’or recyclé', caption: 'Chaque lingot que nous coulons est récupéré et affiné.' },
}
