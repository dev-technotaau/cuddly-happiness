// The house: its two signatures, its three generations, the people at the bench and its promises, in both languages.
// Names, years and roles are placeholders until the family confirms them (owner request, 2026-10-21); the policies are
// the prototype's house rules, chosen the same day: rental fees count toward buying within 60 days, natural diamonds
// only, returns within 30 days for unworn pieces, visits of 45 minutes (an hour for a ring or a design).
import { bilingual } from '../i18n'
import { IMG, type SignatureId } from './catalog'

/** Photos for the house's own sections: the generations' years and the hands at the bench. */
export const HOUSE_IMG = {
  years: [IMG.archive1962, IMG.archive1979, IMG.archive1988, IMG.archive1996, IMG.archive2012, IMG.archive2025],
  hands: [IMG.handsDesign, IMG.handsSetting, IMG.handsBench],
  salon: IMG.salon,
  tray: IMG.tray,
  /** Each signature's photographs: its page's hero, its card, and the card's second (worn) photo. */
  signatures: {
    engagement: { hero: IMG.ovalWorn, card: IMG.oval, worn: IMG.ovalWorn },
    tennis: { hero: IMG.tennisBust, card: IMG.tennisBust, worn: IMG.tennisWorn },
  } as Record<SignatureId, { hero: string; card: string; worn: string }>,
} as const

export const HOUSE = bilingual(
  {
    signatures: {
      engagement: { name: 'Engagement rings', title: 'Engagement <em>rings</em>', numeral: 'I', line: 'Natural, GIA-certified centre stones, hand-set by our master setter on rue Sherbrooke.', cta: 'Discover engagement rings', hero: 'One promise, <em>made</em> by hand.' },
      tennis: { name: 'Diamond tennis necklaces', title: 'Diamond <em>tennis</em> necklaces', numeral: 'II', line: 'Every diamond matched and set by hand, to wear for an evening or keep for life.', cta: 'Discover tennis necklaces', hero: 'A line of light, <em>unbroken</em>.' },
    } as Record<SignatureId, { name: string; title: string; numeral: string; line: string; cta: string; hero: string }>,
    signature: 'Signature',
    numbers: [
      ['1962', 'The year Teresa opened her bench'],
      ['3', 'Generations of one family'],
      ['40+', 'Hours of hand-work in a ring'],
      ['1', 'Atelier, where every piece is made'],
    ] as [string, string][],
    years: [
      ['1962', 'A single bench', 'Teresa Moretti opens a one-bench atelier on rue Sainte-Catherine.'],
      ['1979', 'A son at the bench', 'Antonio joins his mother, and sets the house’s first GIA-graded diamond.'],
      ['1988', 'Rue Sherbrooke', 'The house moves to 1420 rue Sherbrooke Ouest, where it receives today.'],
      ['1996', 'The master setter', 'Marco takes the microscope. Every claw has passed under his eye since.'],
      ['2012', 'The third generation', 'Sofia, Teresa’s granddaughter, draws her first collection.'],
      ['2025', 'The vault opens', 'Our high jewellery can now be worn for an evening, or kept for life.'],
    ] as [string, string, string][],
    hands: [
      ['Sofia Moretti', 'Designer · third generation', 'Every piece starts in pencil. The computer comes later.'],
      ['Marco Moretti', 'Master setter · second generation', 'A claw is right when you can’t feel it.'],
      ['Antonio Moretti', 'Master jeweller · second generation', 'We make each piece so our grandchildren can repair it.'],
    ] as [string, string, string][],
    madeHere: 'Designed and made in our atelier, 1420 rue Sherbrooke Ouest',
    hallmark: 'Every piece leaves the bench with our hallmark.',
    natural: 'We set natural diamonds only, each with its GIA report.',
    rentalCredit: 'Fall for it? Your rental fee counts toward owning the piece within 60 days.',
    returns: 'Returns within 30 days, complimentary, for unworn pieces. Engraved, personalized and made-to-order pieces are final sale.',
    visitLength: 'A private visit lasts 45 minutes, an hour for a ring. Complimentary, and never an obligation.',
  },
  {
    signatures: {
      engagement: { name: 'Bagues de fiançailles', title: 'Bagues de <em>fiançailles</em>', numeral: 'I', line: 'Des pierres centrales naturelles certifiées GIA, serties à la main par notre maître sertisseur, rue Sherbrooke.', cta: 'Découvrir les bagues de fiançailles', hero: 'Une promesse <em>faite</em> main.' },
      tennis: { name: 'Colliers tennis en diamants', title: 'Colliers <em>tennis</em> en diamants', numeral: 'II', line: 'Chaque diamant apparié et serti à la main, à porter le temps d’un soir ou à garder pour la vie.', cta: 'Découvrir les colliers tennis', hero: 'Une ligne de lumière, <em>sans fin</em>.' },
    },
    signature: 'Signature',
    numbers: [
      ['1962', 'L’année où Teresa ouvre son établi'],
      ['3', 'Générations d’une même famille'],
      ['40+', 'Heures de travail à la main pour une bague'],
      ['1', 'Atelier, où chaque pièce est faite'],
    ],
    years: [
      ['1962', 'Un seul établi', 'Teresa Moretti ouvre un atelier d’un seul établi, rue Sainte-Catherine.'],
      ['1979', 'Un fils à l’établi', 'Antonio rejoint sa mère et sertit le premier diamant classé GIA de la maison.'],
      ['1988', 'Rue Sherbrooke', 'La maison s’installe au 1420, rue Sherbrooke Ouest, où elle vous reçoit aujourd’hui.'],
      ['1996', 'Le maître sertisseur', 'Marco prend le microscope. Depuis, chaque griffe passe sous son œil.'],
      ['2012', 'La troisième génération', 'Sofia, petite-fille de Teresa, dessine sa première collection.'],
      ['2025', 'Le coffre s’ouvre', 'Notre haute joaillerie se porte désormais le temps d’un soir, ou se garde pour la vie.'],
    ],
    hands: [
      ['Sofia Moretti', 'Designer · troisième génération', 'Chaque pièce commence au crayon. L’ordinateur vient après.'],
      ['Marco Moretti', 'Maître sertisseur · deuxième génération', 'Une griffe est juste quand on ne la sent pas.'],
      ['Antonio Moretti', 'Maître joaillier · deuxième génération', 'Nous faisons chaque pièce pour que nos petits-enfants puissent la réparer.'],
    ],
    madeHere: 'Dessinée et faite dans notre atelier, 1420, rue Sherbrooke Ouest',
    hallmark: 'Chaque pièce quitte l’établi avec notre poinçon.',
    natural: 'Nous ne sertissons que des diamants naturels, chacun avec son rapport GIA.',
    rentalCredit: 'Coup de cœur ? Vos frais de location sont déduits du prix si vous l’achetez dans les 60 jours.',
    returns: 'Retours sous 30 jours, sans frais, pour les pièces non portées. Les pièces gravées, personnalisées ou faites sur commande sont finales.',
    visitLength: 'Une visite privée dure 45 minutes, une heure pour une bague. Elle est offerte, et sans engagement.',
  },
)
