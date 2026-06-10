export type Compound = {
  id: string;
  name: string;
  smiles?: string;
  pdbId?: string;
  hide3D?: boolean;
  percent?: number;
  pharmacologicalActivity: string;
  therapeuticActivity: string;
  structure2DPlaceholder: string;
  structure3DPlaceholder: string;
  functionalGroups?: {
    name: string;
    description: string;
  }[];
  keyFact?: string;
  pharmaceuticalAnalysis?: {
    molecularWeight: string;
    nominalMass: string;
    isotopeFormula: string;
    massSpectrumUrl: string;
    hnmrUrl: string;
    cnmrUrl: string;
  };
  composition?: { name: string; percentage: number; formula: string }[];
};

export type PlantPart = {
  id: string;
  name: string;
  description: string;
  compounds: Compound[];
  coordinates: { x: number; y: number; width: number; height: number }; // For interactive SVG/image mapping
};

export type Plant = {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  imageUrl: string;
  marketAvailability: string;
  parts: PlantPart[];
  synonyms?: string[];
};

export function getCompoundBioactiveClass(compound: Compound): string[] {
  const name = compound.name.toLowerCase();
  const id = compound.id.toLowerCase();
  const desc = `${compound.pharmacologicalActivity} ${compound.therapeuticActivity}`.toLowerCase();
  
  const classes: string[] = [];
  
  if (name.includes("sinensetin") || name.includes("eupatorin") || name.includes("rutin") || desc.includes("flavonoid") || id.includes("rutin") || id.includes("sinensetin") || id.includes("eupatorin")) {
    classes.push("Flavonoid");
  }
  if (id.includes("nicotine") || name.includes("nicotine") || id.includes("alkaloid") || desc.includes("alkaloid")) {
    classes.push("Alkaloid");
  }
  if (
    id.includes("oleic") || id.includes("linolenic") || id.includes("stearic") || 
    id.includes("palmitic") || id.includes("linoleic") || id.includes("arachidic") || 
    id.includes("ricinoleic") || name.includes("fatty acid") || desc.includes("fatty acid")
  ) {
    classes.push("Fatty Acid");
  }
  if (
    name.includes("acid") || name.includes("salicin") || name.includes("benzoate") ||
    desc.includes("phenolic") || desc.includes("polyphenol") || name.includes("caffeic") || 
    name.includes("rosmarinic") || name.includes("cinnamic") || name.includes("benzoic") || name.includes("salicylate")
  ) {
    classes.push("Phenolic derivative / Organic Acid");
  }
  if (
    id.includes("alginic") || id.includes("carrageenan") || id.includes("agarose") || 
    id.includes("pectin") || id.includes("polysaccharide") || id.includes("arabin") || 
    id.includes("tragacanthin") || id.includes("bassorin") || id.includes("arabinoxylans") ||
    desc.includes("polysaccharide") || desc.includes("gum") || name.includes("gum") || name.includes("pectin")
  ) {
    classes.push("Polysaccharide / Gum");
  }
  if (name.includes("aloin") || name.includes("salicin") || name.includes("rutin") || desc.includes("glycoside")) {
    classes.push("Glycoside");
  }
  if (name.includes("cinnamaldehyde") || name.includes("myristicin") || name.includes("anethole") || desc.includes("phenylpropene")) {
    classes.push("Phenylpropene / Aldehyde");
  }
  if (name.includes("benzoate") || name.includes("salicylate") || desc.includes("ester")) {
    classes.push("Ester");
  }
  
  if (classes.length === 0) {
    if (desc.includes("acid")) {
      classes.push("Organic Acid");
    } else {
      classes.push("Phytochemical (Other)");
    }
  }
  
  return classes;
}

export function getCompoundPharmacologicalActivities(compound: Compound): string[] {
  const text = `${compound.name} ${compound.pharmacologicalActivity} ${compound.therapeuticActivity}`.toLowerCase();
  const activities: string[] = [];
  
  if (text.includes("anticancer") || text.includes("anti-cancer") || text.includes("tumor") || text.includes("tumour") || text.includes("proliferative") || text.includes("neoplastic") || text.includes("carcinoma")) {
    activities.push("Anticancer / Anti-tumor");
  }
  if (text.includes("antipyretic") || text.includes("fever") || text.includes("pyretic") || text.includes("temp")) {
    activities.push("Antipyretic (Fever-reducer)");
  }
  if (text.includes("anti-inflammatory") || text.includes("antiinflammatory") || text.includes("inflammation") || text.includes("arthritis") || text.includes("inflammatory")) {
    activities.push("Anti-inflammatory");
  }
  if (text.includes("antioxidant") || text.includes("oxidative") || text.includes("free radical")) {
    activities.push("Antioxidant");
  }
  if (text.includes("diuretic") || text.includes("urinary") || text.includes("kidney stone") || text.includes("renal") || text.includes("calcuria") || text.includes("fluid retention")) {
    activities.push("Diuretic / Kidney Health");
  }
  if (text.includes("antiseptic") || text.includes("antimicrobial") || text.includes("bacterial") || text.includes("microbe") || text.includes("disinfectant") || text.includes("vulnerary") || text.includes("wound")) {
    activities.push("Antiseptic / Antimicrobial");
  }
  if (text.includes("analgesic") || text.includes("pain") || text.includes("anesthetic") || text.includes("nociceptive")) {
    activities.push("Analgesic (Pain relief)");
  }
  if (text.includes("laxative") || text.includes("bowel") || text.includes("constipation") || text.includes("purgative") || text.includes("digestion")) {
    activities.push("Laxative / Bowel Regulator");
  }
  if (text.includes("neuro") || text.includes("addiction") || text.includes("cholinergic") || text.includes("stimulant")) {
    activities.push("Neuroactive / Stimulant");
  }
  
  if (activities.length === 0) {
    activities.push("Bioactive / Other");
  }
  
  return activities;
}

export function getCompoundFormulationRoles(compound: Compound): string[] {
  const text = `${compound.name} ${compound.pharmacologicalActivity} ${compound.therapeuticActivity}`.toLowerCase();
  const roles: string[] = [];
  
  if (text.includes("fatty base") || text.includes("stearic") || text.includes("palmitic") || text.includes("suppository") || text.includes("ointment base") || text.includes("solididity") || text.includes("butter")) {
    roles.push("Fatty Base / Ointment Base");
  }
  if (text.includes("solvent") || text.includes("vehicle") || text.includes("injection") || text.includes("benzyl benzoate") || text.includes("dissolve")) {
    roles.push("Solvent / Vehicle");
  }
  if (text.includes("emulsif") || text.includes("surfactant") || text.includes("emulsion") || text.includes("arachidic") || text.includes("micelle") || text.includes("suspension stabilizer")) {
    roles.push("Emulsifier / Stabilizer");
  }
  if (text.includes("thicken") || text.includes("gel") || text.includes("gelling") || text.includes("viscous") || text.includes("gum") || text.includes("mucilage") || text.includes("pectin") || text.includes("alginic") || text.includes("carrageenan") || text.includes("agarose")) {
    roles.push("Thickening / Gelling Agent");
  }
  
  if (roles.length === 0) {
    roles.push("Active Substance (Medicinal)");
  }
  
  return roles;
}

export const plantsData: Plant[] = [
  {
    id: "misai-kucing",
    name: "Misai Kucing",
    scientificName: "Orthosiphon aristatus",
    description: "A medicinal herb widely grown in Southeast Asia, known for its white or purple flowers bearing long, protruding stamens that resemble cat's whiskers. Traditionally used for treating kidney diseases, bladder inflammation, gout, and diabetes.",
    synonyms: ["Java Tea", "Cat's Whiskers"],
    imageUrl: "/misai_kucing.jpg",
    marketAvailability: "Commonly available as dried leaves for tea, standardized extracts in capsules, and liquid tinctures in health stores across Southeast Asia and globally.",
    parts: [
      {
        id: "flowers",
        name: "Flowers",
        description: "The distinctive 'cat's whiskers' flowers contain essential oils and specific caffeic acid derivatives.",
        coordinates: { x: 48, y: 8, width: 22, height: 50 }, // Adjusted to target the right flower spike
        compounds: [
          {
            id: "caffeic-acid",
            name: "Caffeic Acid",
            pdbId: "4N0S",
            pharmacologicalActivity: "Strong antioxidant and immunomodulatory effects.",
            therapeuticActivity: "Supports immune system and protects against cellular damage.",
            structure2DPlaceholder: "https://picsum.photos/seed/caffeic2d/300/200",
            structure3DPlaceholder: "Upload .pdb or .pdbqt for Caffeic Acid 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "180.16 g/mol",
              nominalMass: "180 Da",
              isotopeFormula: "C9H8O4",
              massSpectrumUrl: "https://picsum.photos/seed/caffeic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/caffeic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/caffeic-cnmr/400/300"
            }
          }
        ]
      },
      {
        id: "leaves",
        name: "Leaves",
        description: "The leaves are the most commonly used part of Misai Kucing, rich in phenolic compounds and flavonoids.",
        coordinates: { x: 5, y: 40, width: 36, height: 32 }, // Adjusted to target the larger left leaf cluster
        compounds: [
          {
            id: "rosmarinic-acid",
            name: "Rosmarinic Acid",
            pdbId: "7BM3",
            pharmacologicalActivity: "Antioxidant, anti-inflammatory, antimicrobial, anti-angiogenic, and diuretic properties.",
            therapeuticActivity: "Used in managing oxidative stress-related diseases, inflammation, kidney stones, urinary tract health, and as a natural preservative.",
            structure2DPlaceholder: "https://picsum.photos/seed/rosmarinic2d/300/200",
            structure3DPlaceholder: "Upload .pdb or .pdbqt for Rosmarinic Acid 3D view",
            functionalGroups: [
              { name: "Catechol rings", description: "Two ortho-dihydroxybenzene (catechol) rings provide potent antioxidant activity by donating hydrogen atoms to free radicals." },
              { name: "Ester linkage", description: "Connects the caffeic acid and 3,4-dihydroxyphenyllactic acid moieties; susceptible to hydrolysis in the gut." },
              { name: "Carboxylic acid", description: "Contributes to the molecule's acidity and interacts with polar residues in protein targets." },
              { name: "Unsaturated alkene", description: "The alpha,beta-unsaturated double bond adds to the extended conjugation and electron delocalization." }
            ],
            keyFact: "Despite its name, it is a derivative of caffeic acid, widely recognized as one of the most potent natural antioxidants found in the Lamiaceae (mint) family.",
            pharmaceuticalAnalysis: {
              molecularWeight: "360.31 g/mol",
              nominalMass: "360 Da",
              isotopeFormula: "C18H16O8",
              massSpectrumUrl: "https://picsum.photos/seed/rosmarinic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/rosmarinic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/rosmarinic-cnmr/400/300"
            }
          },
          {
            id: "sinensetin",
            name: "Sinensetin",
            hide3D: true,
            pharmacologicalActivity: "Potent diuretic, anti-inflammatory, and anti-tumor activities.",
            therapeuticActivity: "Helps in treating kidney stones, edema, and exhibits potential in cancer therapy.",
            structure2DPlaceholder: "https://picsum.photos/seed/sinensetin2d/300/200",
            structure3DPlaceholder: "Upload .pdb or .pdbqt for Sinensetin 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "372.37 g/mol",
              nominalMass: "372 Da",
              isotopeFormula: "C20H20O7",
              massSpectrumUrl: "https://picsum.photos/seed/sinensetin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/sinensetin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/sinensetin-cnmr/400/300"
            }
          },
          {
            id: "eupatorin",
            name: "Eupatorin",
            hide3D: true,
            pharmacologicalActivity: "Vasodilatory, anti-proliferative, and anti-inflammatory.",
            therapeuticActivity: "Potential use in cardiovascular health and cancer prevention.",
            structure2DPlaceholder: "https://picsum.photos/seed/eupatorin2d/300/200",
            structure3DPlaceholder: "Upload .pdb or .pdbqt for Eupatorin 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "344.32 g/mol",
              nominalMass: "344 Da",
              isotopeFormula: "C18H16O7",
              massSpectrumUrl: "https://picsum.photos/seed/eupatorin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/eupatorin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/eupatorin-cnmr/400/300"
            }
          }
        ]
      },
      {
        id: "stem",
        name: "Stem",
        description: "The stems contain high levels of potassium salts and essential oils.",
        coordinates: { x: 55, y: 62, width: 12, height: 35 }, // Adjusted to target the actual stem on the right
        compounds: []
      }
    ]
  },
  {
    id: "tobacco-plant",
    name: "Tobacco plant",
    scientificName: "Nicotiana tabacum",
    synonyms: ["Common Tobacco", "Virginia Tobacco"],
    description: "Nicotiana tabacum is an annual herbaceous plant belonging to the family Solanaceae. It is one of the most widely cultivated commercial plants in the world and is primarily grown for its nicotine-rich leaves. The plant typically reaches 1–3 meters in height, possesses large sticky leaves, pink tubular flowers, and a thick hairy stem. It originated in the Americas and later spread globally through colonial trade and agriculture. Chemically, the plant is rich in alkaloids, especially nicotine, together with nornicotine, anatabine, flavonoids, terpenoids, and phenolic compounds. Biologically, it exhibits insecticidal, antimicrobial, antioxidant, and neuroactive properties. Tobacco has also become an important model organism in plant biotechnology and molecular farming for recombinant protein and vaccine production. However, many descriptions of tobacco become intellectually dishonest because they isolate pharmacological activities from toxicological reality. The same plant associated with useful bioactive metabolites is also linked to addiction, carcinogenicity, cardiovascular disease, and respiratory disorders due to nicotine and tobacco-specific nitrosamines. Any scientific discussion that ignores both dimensions is incomplete and scientifically weak.",
    imageUrl: "/tobacco_plant.jpeg",
    marketAvailability: "Widely available globally.",
    parts: [
      {
        id: "leaves",
        name: "Leaves",
        description: "The primary source of nicotine and other alkaloids.",
        coordinates: { x: 30, y: 30, width: 40, height: 40 },
        compounds: [
          {
            id: "nicotine",
            name: "Nicotine",
            pdbId: "9LHA",
            pharmacologicalActivity: "Potent neuroactive and insecticidal properties. antimicrobial, antifungal, insecticidal, antioxidant, anti-inflammatory, and cytotoxic activities.",
            therapeuticActivity: "Used in agricultural pesticides and nicotine replacement therapies.",
            structure2DPlaceholder: "https://picsum.photos/seed/nicotine2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Nicotine",
            pharmaceuticalAnalysis: {
              molecularWeight: "162.23 g/mol",
              nominalMass: "162 Da",
              isotopeFormula: "C10H14N2",
              massSpectrumUrl: "https://picsum.photos/seed/nicotine-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/nicotine-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/nicotine-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "ceylon-cinnamon",
    name: "Ceylon cinnamon",
    scientificName: "Cinnamomum verum",
    synonyms: ["True Cinnamon", "Sri Lankan Cinnamon"],
    description: "Evergreen tree; its inner bark is used to make cinnamon, a spice widely used in cooking. The bark is also used traditionally for GI upset, diarrhea, and infections.",
    imageUrl: "/ceylon_cinnamon.jpeg",
    marketAvailability: "Yes (spice, essential oil, medicinal products).",
    parts: [
      {
        id: "bark",
        name: "Bark",
        description: "Bark used as stomachic, for abdominal pains.",
        coordinates: { x: 40, y: 40, width: 20, height: 30 },
        compounds: [
          {
            id: "cinnamaldehyde",
            name: "Cinnamaldehyde",
            pdbId: "6AHL",
            pharmacologicalActivity: "Antispasmodic, antimicrobial, and potential antiulcer properties.",
            therapeuticActivity: "Used for digestive disorders and as an antimicrobial agent.",
            structure2DPlaceholder: "https://picsum.photos/seed/cinnamaldehyde2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Cinnamaldehyde",
            functionalGroups: [
              { name: "Aldehyde group", description: "The highly reactive carbonyl carbon can form Schiff bases with proteins, accounting for its antimicrobial action." },
              { name: "Conjugated double bond", description: "Connects the phenyl ring to the aldehyde, giving the molecule stability and its yellowish color." },
              { name: "Aromatic ring", description: "Enhances the lipophilicity, allowing the compound to penetrate bacterial cell membranes." }
            ],
            keyFact: "Its distinctive flavor and scent come from the combination of the aromatic ring conjugated directly with the aldehyde group, making it an essential spice in culinary traditions worldwide.",
            pharmaceuticalAnalysis: {
              molecularWeight: "132.16 g/mol",
              nominalMass: "132 Da",
              isotopeFormula: "C9H8O",
              massSpectrumUrl: "https://picsum.photos/seed/cinnamaldehyde-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/cinnamaldehyde-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/cinnamaldehyde-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "nutmeg",
    name: "Nutmeg",
    scientificName: "Myristica fragrans",
    synonyms: ["Fragrant Nutmeg", "True Nutmeg", "Pala"],
    description: "Nutmeg is a spice made from the seed of the nutmeg tree, a tropical evergreen native to Indonesia. The seed is used for digestive disorders, asthenia, and weight gain.",
    imageUrl: "/nutmeg_plant.jpg",
    marketAvailability: "Widely available globally as a spice and essential oil.",
    parts: [
      {
        id: "seed",
        name: "Seed (nut)",
        description: "The inner seed is dried and used as the spice nutmeg.",
        coordinates: { x: 33, y: 43, width: 25, height: 25 },
        compounds: [
          {
            id: "myristicin",
            name: "Myristicin",
            hide3D: true,
            pharmacologicalActivity: "Antimicrobial, anti-inflammatory; hallucinogenic at high doses.",
            therapeuticActivity: "Used for digestive disorders and historically for pain relief.",
            structure2DPlaceholder: "https://picsum.photos/seed/myristicin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Myristicin",
            pharmaceuticalAnalysis: {
              molecularWeight: "192.21 g/mol",
              nominalMass: "192 Da",
              isotopeFormula: "C11H12O3",
              massSpectrumUrl: "https://picsum.photos/seed/myristicin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/myristicin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/myristicin-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "star-anise",
    name: "Star Anise",
    scientificName: "Illicium verum",
    synonyms: ["Chinese Star Anise", "Badian"],
    description: "A medium-sized evergreen tree native to northeast Vietnam and southwest China. The star shaped fruits are harvested just before ripening and are widely used in culinary and medicinal applications.",
    imageUrl: "/star_anise.jpg",
    marketAvailability: "Available globally as whole fruit, powder, or essential oil.",
    parts: [
      {
        id: "fruit",
        name: "Fruit (star capsule)",
        description: "The ripe fruit is used for respiratory infections, dyspepsia, and bloating.",
        coordinates: { x: 30, y: 30, width: 40, height: 40 },
        compounds: [
          {
            id: "anethole",
            name: "Anethole",
            pdbId: "8S1J",
            pharmacologicalActivity: "Antispasmodic, carminative, and expectorant.",
            therapeuticActivity: "Relieves bloating, coughs, and acts as a mild digestive tonic.",
            structure2DPlaceholder: "https://picsum.photos/seed/anethole2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Anethole",
            pharmaceuticalAnalysis: {
              molecularWeight: "148.20 g/mol",
              nominalMass: "148 Da",
              isotopeFormula: "C10H12O",
              massSpectrumUrl: "https://picsum.photos/seed/anethole-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/anethole-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/anethole-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "aloe-vera",
    name: "Aloe Vera",
    scientificName: "Aloe barbadensis Miller",
    synonyms: ["Barbados Aloe", "Medicinal Aloe"],
    description: "Aloe vera is a popular, low-maintenance succulent known for its thick, fleshy green leaves containing a medicinal gel used for skin burns and irritations.",
    imageUrl: "/aloe_vera_plant.jpg",
    marketAvailability: "Gel, juice, capsules, extract, topical gels, cosmetics.",
    parts: [
      {
        id: "leaves",
        name: "Leaves",
        description: "The inner leaf contains a mucilage gel widely used in medicine." ,
        coordinates: { x: 35, y: 20, width: 30, height: 60 },
        compounds: [
          {
            id: "aloin",
            name: "Aloin",
            hide3D: true,
            pharmacologicalActivity: "Wound healing, anti-inflammatory, and strong laxative effects.",
            therapeuticActivity: "Used for short-term constipation relief.",
            structure2DPlaceholder: "https://picsum.photos/seed/aloin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Aloin",
            pharmaceuticalAnalysis: {
              molecularWeight: "418.40 g/mol",
              nominalMass: "418 Da",
              isotopeFormula: "C21H22O9",
              massSpectrumUrl: "https://picsum.photos/seed/aloin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/aloin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/aloin-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "castor-plant",
    name: "Castor Bean",
    scientificName: "Ricinus communis",
    synonyms: ["Castor Oil Plant", "Palma Christi"],
    description: "The castor bean is a fast-growing shrub or small tree. The fixed oil obtained from its seeds is a potent medicinal agent.",
    imageUrl: "/castor_bean.jpg",
    marketAvailability: "Available globally as pure Castor Oil for medicinal and cosmetic use.",
    parts: [
      {
        id: "seeds",
        name: "Seeds",
        description: "Pressed to yield Castor Oil.",
        coordinates: { x: 30, y: 30, width: 30, height: 30 },
        compounds: [
          {
            id: "ricinoleic-acid",
            name: "Ricinoleic acid",
            pdbId: "2CM4",
            pharmacologicalActivity: "Stimulant laxative, emollient, lubricant.",
            therapeuticActivity: "Used heavily in pharmaceutical vehicles and as an active laxative.",
            structure2DPlaceholder: "https://picsum.photos/seed/ricinoleic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Ricinoleic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "298.46 g/mol",
              nominalMass: "298 Da",
              isotopeFormula: "C18H34O3",
              massSpectrumUrl: "https://picsum.photos/seed/ricinoleic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/ricinoleic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/ricinoleic-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "brown-seaweeds",
    name: "Brown seaweed",
    scientificName: "Laminaria, Macrocystis",
    synonyms: ["Kelp", "Kombu", "Sea Girdle"],
    description: "The whole thallus (marine algal body) is used as the source material. Mainly composed of linear copolymers of β-D-mannuronic acid (M units) and α-L-guluronic acid (G units).",
    imageUrl: "/brown_seaweed.jpg",
    marketAvailability: "Antacid formulations, wound dressings, dental impression materials, pharma excipient suppliers.",
    parts: [
      {
        id: "thallus",
        name: "Thallus",
        description: "The entire algal body is used to extract alginates.",
        coordinates: { x: 30, y: 30, width: 40, height: 40 },
        compounds: [
          {
            id: "alginic-acid",
            name: "Alginic Acid",
            pdbId: "4OZV",
            pharmacologicalActivity: "Thickening agent, suspending agent, tablet binder, wound dressing, dental impression material.",
            therapeuticActivity: "Used in antacids to form a protective raft, and as a hydrophilic excipient.",
            structure2DPlaceholder: "https://picsum.photos/seed/alginic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Alginate",
            pharmaceuticalAnalysis: {
              molecularWeight: "~176 g/mol per unit",
              nominalMass: "176 Da",
              isotopeFormula: "C6H8O6 (monomer)",
              massSpectrumUrl: "https://picsum.photos/seed/alginic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/alginic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/alginic-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "red-seaweeds-carrageenans",
    name: "Red seaweed",
    scientificName: "Chondrus crispus, Gelidium, and Gracilaria species",
    synonyms: ["Irish Moss", "Carragheen", "Sea Moss", "Kanten", "China Grass", "Japanese Isinglass"],
    description: "Marine algae that are rich sources of industrial and pharmaceutical hydrocolloids. Extracts include carrageenans (sulfated D-galactose and 3,6-anhydro-D-galactose polymers) and agar (agarose and agaropectin galactose-based polymers) obtained from the entire body (thallus) of various species.",
    imageUrl: "/red_seaweed.jpg",
    marketAvailability: "Powder, strips, flakes. Suspending agent, laxative preparations, and culture media.",
    parts: [
      {
        id: "thallus",
        name: "Thallus",
        description: "Processed block of entire algal body, the source of carrageenans and agar.",
        coordinates: { x: 20, y: 20, width: 60, height: 60 },
        compounds: [
          {
            id: "carrageenan",
            name: "Carrageenan",
            hide3D: true,
            pharmacologicalActivity: "Pharmaceutical suspensions, gels, food stabilizers.",
            therapeuticActivity: "Gelling, stabilizing, emulsifying agent.",
            structure2DPlaceholder: "https://picsum.photos/seed/carrageenan2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Carrageenan",
            pharmaceuticalAnalysis: {
              molecularWeight: "100k - 800k Da",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O, S",
              massSpectrumUrl: "https://picsum.photos/seed/carrageenan-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/carrageenan-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/carrageenan-cnmr/400/300"
            }
          },
          {
            id: "agarose",
            name: "Agarose",
            hide3D: true,
            pharmacologicalActivity: "Laxative, culture media, suspending agent, suppository base.",
            therapeuticActivity: "Acts as a bulk laxative and suspending agent.",
            structure2DPlaceholder: "https://picsum.photos/seed/agarose2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Agarose",
            pharmaceuticalAnalysis: {
              molecularWeight: "Very high",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O",
              massSpectrumUrl: "https://picsum.photos/seed/agarose-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/agarose-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/agarose-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "citrus-fruit-pectins",
    name: "Citrus fruit",
    scientificName: "Citrus spp.",
    synonyms: ["Citrus", "Citrus Fruit"],
    description: "Mainly composed of partially methylated polygalacturonic acid chains. It also contains rhamnose, arabinose, galactose, and methoxyl groups depending on degree of esterification.",
    imageUrl: "/citrus_plant.jpg",
    marketAvailability: "Antidiarrheal preparations, food/pharma gelling agents.",
    parts: [
      {
        id: "peel",
        name: "Fruit peel and pulp cell wall",
        description: "The medicinal source is the fruit peel and pulp cell wall.",
        coordinates: { x: 65, y: 55, width: 28, height: 40 },
        compounds: [
          {
            id: "pectin",
            name: "Pectin",
            hide3D: true,
            pharmacologicalActivity: "Gelling agent, stabilizer. Antidiarrheal preparations.",
            therapeuticActivity: "Used as a gelling agent and in antidiarrheal formulations.",
            structure2DPlaceholder: "https://picsum.photos/seed/pectin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Pectin",
            pharmaceuticalAnalysis: {
              molecularWeight: "50-150 kDa",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O",
              massSpectrumUrl: "https://picsum.photos/seed/pectin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/pectin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/pectin-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "gums-sterculia",
    name: "Ghost Tree",
    scientificName: "Sterculia urens",
    description: "Obtained as a dried gummy exudate from the bark and stem of Sterculia urens. Contains acidic polysaccharides mainly composed of galactose, rhamnose, and galacturonic acid.",
    synonyms: ["Karaya Gum Tree", "Indian Tragacanth", "Katira"],
    imageUrl: "/ghost_tree.jpg",
    marketAvailability: "Bulk laxative products, denture adhesives.",
    parts: [
      {
        id: "gum-exudate",
        name: "Tree resin / gum",
        description: "Naturally oozes out after injury to the trunk.",
        coordinates: { x: 50, y: 65, width: 25, height: 35 },
        compounds: [
          {
            id: "sterculia-polysaccharide",
            name: "Sterculia Polysaccharide",
            hide3D: true,
            pharmacologicalActivity: "Bulk laxative, tablet binder, thickener.",
            therapeuticActivity: "Used as a bulk-forming laxative.",
            structure2DPlaceholder: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/galacturonic%20acid/PNG",
            structure3DPlaceholder: "Interactive 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "High",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O",
              massSpectrumUrl: "https://picsum.photos/seed/sterculia-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/sterculia-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/sterculia-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "acacia-senegal",
    name: "Arabic Gum Tree",
    scientificName: "Acacia senegal",
    synonyms: ["Gum Arabic Tree", "Gum Acacia", "Senegal Gum"],
    description: "Obtained as dried gummy exudate from the stem and branches of Acacia senegal. Contains arabin (a complex polysaccharide), calcium, magnesium, and potassium salts of arabic acid.",
    imageUrl: "/Acacia_Gum.jpg",
    marketAvailability: "Powder, granules, syrups, emulsions, suspensions, tablet binder.",
    parts: [
      {
        id: "gum-arabic",
        name: "Dried gummy exudate",
        description: "Oozes after natural injury or incision.",
        coordinates: { x: 35, y: 35, width: 30, height: 30 },
        compounds: [
          {
            id: "arabin",
            name: "Arabin / Arabic acid salts",
            pdbId: "3A23",
            pharmacologicalActivity: "Emulsifier, suspending agent, binder, demulcent.",
            therapeuticActivity: "Pharmaceutical excipient for stabilization.",
            structure2DPlaceholder: "https://picsum.photos/seed/arabin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "Highly variable",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O",
              massSpectrumUrl: "https://picsum.photos/seed/acacia-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/acacia-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/acacia-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "tragacanth-gum",
    name: "Tragacanth Gum",
    scientificName: "Astragalus gummifer",
    synonyms: ["Goat's Thorn", "Syrian Tragacanth", "Gum Tragacanth"],
    description: "Swells in water to form viscous gel. Contains tragacanthin and bassorin.",
    imageUrl: "/tragacanth.jpg",
    marketAvailability: "Suspensions, emulsifying agent, ointment base.",
    parts: [
      {
        id: "tragacanth-exudate",
        name: "Tree resin / gum",
        description: "Dried sap.",
        coordinates: { x: 50, y: 65, width: 25, height: 35 },
        compounds: [
          {
            id: "tragacanthin",
            name: "Tragacanthin",
            hide3D: true,
            pharmacologicalActivity: "Water-soluble demulcent and emulsion stabilizer.",
            therapeuticActivity: "Strong viscosifying and suspending properties, used as a stabilizer in food and pharmacy.",
            structure2DPlaceholder: "https://picsum.photos/seed/tragacanthin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "High",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O",
              massSpectrumUrl: "https://picsum.photos/seed/tragacanth-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/tragacanth-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/tragacanth-cnmr/400/300"
            }
          },
          {
            id: "bassorin",
            name: "Bassorin",
            hide3D: true,
            pharmacologicalActivity: "Water-insoluble fraction that swells extensively in water to form a highly viscous gel.",
            therapeuticActivity: "Thickening agent, stabilizer, and visual texture enhancer in suspensions.",
            structure2DPlaceholder: "https://picsum.photos/seed/bassorin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "Very High",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O",
              massSpectrumUrl: "https://picsum.photos/seed/bassorin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/bassorin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/bassorin-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "plantago-ovata",
    name: "Blond Plantain",
    scientificName: "Plantago ovata",
    synonyms: ["Psyllium", "Ispaghula", "Desert Indianwheat", "Blond Psyllium"],
    description: "Seed husk rich in arabinoxylans. Contains arabinoxylans.",
    imageUrl: "/plantago_ovata.jpg",
    marketAvailability: "Husk, powder, capsules. Laxatives, fiber supplements.",
    parts: [
      {
        id: "seed-husk",
        name: "Seed husk",
        description: "The outer layer of the seed, rich in water-soluble fiber.",
        coordinates: { x: 35, y: 35, width: 30, height: 30 },
        compounds: [
          {
            id: "arabinoxylans",
            name: "Arabinoxylans",
            pdbId: "3C7H",
            pharmacologicalActivity: "Bulk-forming laxative.",
            therapeuticActivity: "Constipation treatment, bowel regulators.",
            structure2DPlaceholder: "https://picsum.photos/seed/plantago2d/300/200",
            structure3DPlaceholder: "Interactive 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "High",
              nominalMass: "Varies",
              isotopeFormula: "Mainly C, H, O",
              massSpectrumUrl: "https://picsum.photos/seed/plantago-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/plantago-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/plantago-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "olive-oil",
    name: "Olive oil",
    scientificName: "Olea europaea",
    synonyms: ["Olive Tree", "European Olive"],
    description: "Fruit mesocarp as a drug. Contains Oleic acid, linoleic acid, palmitic acid, stearic acid, squalene, tocopherols, phytosterols.",
    imageUrl: "/olive_plant.jpg",
    marketAvailability: "Pharmaceutical emollient, medicinal oil.",
    parts: [
      {
        id: "olive-fruit",
        name: "Fruit (mesocarp)",
        description: "Fleshy part of the fruit yields oil.",
        coordinates: { x: 35, y: 30, width: 30, height: 40 },
        compounds: [
          {
            id: "oleic-acid",
            name: "Oleic Acid",
            pdbId: "2WQ9",
            pharmacologicalActivity: "Emollient, laxative, vehicle for injections, ointment base, skin protectant.",
            therapeuticActivity: "Used as a pharmaceutical vehicle and emollient.",
            structure2DPlaceholder: "https://picsum.photos/seed/oleicacid2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Oleic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "282.46 g/mol",
              nominalMass: "282 Da",
              isotopeFormula: "C18H34O2",
              massSpectrumUrl: "https://picsum.photos/seed/oliveoil-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/oliveoil-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/oliveoil-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "flaxseed",
    name: "Flexseed",
    scientificName: "Linum usitatissimum (Flaxseed)",
    synonyms: ["Flax", "Flaxseed", "Linseed"],
    description: "Source of α-Linolenic acid, linoleic acid, oleic acid, palmitic acid, stearic acid.",
    imageUrl: "/lunum.jpg",
    marketAvailability: "Oil bottle, capsules, nutritional supplement, essential fatty acid source.",
    parts: [
      {
        id: "flax-seeds",
        name: "Seeds",
        description: "Produces linseed/flaxseed oil.",
        coordinates: { x: 35, y: 35, width: 30, height: 30 },
        compounds: [
          {
            id: "alpha-linolenic-acid",
            name: "α-Linolenic acid",
            pdbId: "7FFX",
            pharmacologicalActivity: "Nutritional supplement, emollient, source of essential fatty acids.",
            therapeuticActivity: "Source of omega-3.",
            structure2DPlaceholder: "https://picsum.photos/seed/linolenic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for α-Linolenic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "278.43 g/mol",
              nominalMass: "278 Da",
              isotopeFormula: "C18H30O2",
              massSpectrumUrl: "https://picsum.photos/seed/flax-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/flax-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/flax-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "cacao",
    name: "Cocoa Tree",
    scientificName: "Theobroma cacao",
    synonyms: ["Cacao Tree", "Chocolate Tree"],
    description: "Seeds (cocoa beans) contain triglycerides of stearic acid, palmitic acid, oleic acid.",
    imageUrl: "/theobroma.jpg",
    marketAvailability: "Solid fat blocks, suppository base, ointment base.",
    parts: [
      {
        id: "cocoa-beans",
        name: "Cocoa beans",
        description: "Seeds are processed back into cocoa butter.",
        coordinates: { x: 30, y: 30, width: 40, height: 40 },
        compounds: [
          {
            id: "stearic-acid",
            name: "Stearic acid",
            pdbId: "4WBK",
            percent: 34.5,
            pharmacologicalActivity: "Saturated fatty acid. Plays a critical role in providing solidity and texture to cocoa butter at room temperature.",
            therapeuticActivity: "Acts as a structural hardening agent and emollient in cream, ointment, and suppository bases.",
            structure2DPlaceholder: "https://picsum.photos/seed/stearic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Stearic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "284.48 g/mol",
              nominalMass: "284 Da",
              isotopeFormula: "C18H36O2",
              massSpectrumUrl: "https://picsum.photos/seed/stearic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/stearic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/stearic-cnmr/400/300"
            }
          },
          {
            id: "oleic-acid-cacao",
            name: "Oleic Acid",
            pdbId: "2WQ9",
            percent: 34.5,
            pharmacologicalActivity: "Major monounsaturated omega-9 fatty acid. Acts as an emollient, vehicle for injections, and skin protectant.",
            therapeuticActivity: "Moisturizes skin and helps maintain structural consistency of the suppository base.",
            structure2DPlaceholder: "https://picsum.photos/seed/oleicacid2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Oleic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "282.46 g/mol",
              nominalMass: "282 Da",
              isotopeFormula: "C18H34O2",
              massSpectrumUrl: "https://picsum.photos/seed/oliveoil-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/oliveoil-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/oliveoil-cnmr/400/300"
            }
          },
          {
            id: "palmitic-acid",
            name: "Palmitic acid",
            pdbId: "6QGS",
            percent: 26.0,
            pharmacologicalActivity: "Common saturated fatty acid. Contributes to solidity and high stability against lipid oxidation.",
            therapeuticActivity: "Acts as a texturizer, emollient, and stabilizer in pharmaceutical vehicles.",
            structure2DPlaceholder: "https://picsum.photos/seed/palmitic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Palmitic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "256.42 g/mol",
              nominalMass: "256 Da",
              isotopeFormula: "C16H32O2",
              massSpectrumUrl: "https://picsum.photos/seed/palmitic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/palmitic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/palmitic-cnmr/400/300"
            }
          },
          {
            id: "linoleic-acid",
            name: "Linoleic acid",
            pdbId: "7WDJ",
            percent: 3.2,
            pharmacologicalActivity: "Essential polyunsaturated omega-6 fatty acid. Enhances skin penetration and exhibits mild anti-inflammatory properties.",
            therapeuticActivity: "Supports cutaneous barrier repair and fluidizes dense lipophilic formulations.",
            structure2DPlaceholder: "https://picsum.photos/seed/linoleic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Linoleic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "280.45 g/mol",
              nominalMass: "280 Da",
              isotopeFormula: "C18H32O2",
              massSpectrumUrl: "https://picsum.photos/seed/linoleic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/linoleic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/linoleic-cnmr/400/300"
            }
          },
          {
            id: "arachidic-acid",
            name: "Arachidic acid",
            pdbId: "7X4J",
            percent: 1.0,
            pharmacologicalActivity: "Long-chain saturated fatty acid found in minor parts. Provides emulsification enhancement and fine crystallization consistency.",
            therapeuticActivity: "Minor constituent utilized for high-stability lubrication and texture modulation.",
            structure2DPlaceholder: "https://picsum.photos/seed/arachidic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Arachidic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "312.54 g/mol",
              nominalMass: "312 Da",
              isotopeFormula: "C20H40O2",
              massSpectrumUrl: "https://picsum.photos/seed/arachidic-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/arachidic-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/arachidic-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "japanese-pagoda",
    name: "Japanese pagoda",
    scientificName: "Sophora japonica L.",
    synonyms: ["First-Class Scholar Tree", "Japanese Pagoda Tree"],
    description: "Cardiovascular protective and antioxidant medicinal plant. Contains Rutin, Quercetin, Kaempferol, Isorhamnetin, Genistein.",
    imageUrl: "/Japanese_Pagoda.jpeg",
    marketAvailability: "Facial serums, extracts, pharmaceutical preparations.",
    parts: [
      {
        id: "flower-buds",
        name: "Flower buds",
        description: "Rich source of flavonoids like rutin.",
        coordinates: { x: 30, y: 30, width: 40, height: 40 },
        compounds: [
          {
            id: "rutin",
            name: "Rutin (Quercetin-3-O-rutinoside)",
            pdbId: "1RY8",
            pharmacologicalActivity: "Antioxidant, Anti-inflammatory, Vasoprotective, Anticancer, Anti-diabetic.",
            therapeuticActivity: "Capillary protectant.",
            structure2DPlaceholder: "https://picsum.photos/seed/rutin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Rutin",
            pharmaceuticalAnalysis: {
              molecularWeight: "610.52 g/mol",
              nominalMass: "610 Da",
              isotopeFormula: "C27H30O16",
              massSpectrumUrl: "https://picsum.photos/seed/rutin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/rutin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/rutin-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "meadowsweet",
    name: "Meadowsweet",
    scientificName: "Filipendula ulmaria (Spirea ulmaria L.), Rosaceae",
    synonyms: ["Queen-of-the-Meadow", "Pride of the Meadow"],
    description: "Naturally occurring in Europe as a herbaceous perennial. Relieves rheumatism, arthritis, fever, headache, toothache.",
    imageUrl: "/meadow.jpg",
    marketAvailability: "Extracts and herbal infusions.",
    parts: [
      {
        id: "meadowsweet-flowers",
        name: "Flowers",
        description: "Small yellowish-white flowers used in traditional medicine.",
        coordinates: { x: 30, y: 30, width: 40, height: 40 },
        compounds: [
          {
            id: "salicylic-acid",
            name: "Salicylic acid",
            pdbId: "5F1A",
            pharmacologicalActivity: "Analgesic, Antimicrobial and antipyretic.",
            therapeuticActivity: "Pain relief, fever reducer.",
            structure2DPlaceholder: "https://picsum.photos/seed/salicylic2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Salicylic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "138.12 g/mol",
              nominalMass: "138 Da",
              isotopeFormula: "C7H6O3",
              massSpectrumUrl: "https://picsum.photos/seed/meadowsweet-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/meadowsweet-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/meadowsweet-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "willow",
    name: "Willow tree",
    scientificName: "Salix alba L. (Salicaceae)",
    synonyms: ["White Willow", "Sallow", "Osier"],
    description: "The willows are trees common in damp regions all over Europe. The bark of these trees displays a high content of salicin.",
    imageUrl: "/willow.jpg",
    marketAvailability: "Herbal supplements and topical solutions.",
    parts: [
      {
        id: "willow-bark",
        name: "Bark",
        description: "High content of salicin.",
        coordinates: { x: 50, y: 50, width: 30, height: 40 },
        compounds: [
          {
            id: "salicin",
            name: "Salicin",
            pdbId: "9K6L",
            pharmacologicalActivity: "Analgesic, anti-inflammatory.",
            therapeuticActivity: "Natural alternative for pain relief.",
            structure2DPlaceholder: "https://picsum.photos/seed/salicin2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Salicin",
            pharmaceuticalAnalysis: {
              molecularWeight: "286.28 g/mol",
              nominalMass: "286 Da",
              isotopeFormula: "C13H18O7",
              massSpectrumUrl: "https://picsum.photos/seed/willow-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/willow-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/willow-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "peruvian-balsam",
    name: "Peruvian Balsam",
    scientificName: "Myroxylon balsamum",
    synonyms: ["Balsam of Peru", "Balsam of Tolu", "Tolu Balsam Tree", "Peruvian Balsam Tree", "Quina"],
    description: "A tall tropical tree native to South and Central America. Its valuable fragrant balsamic resin is harvested in two forms: Balsam of Peru (extracted from scorched bark) and Balsam of Tolu (exuded from the trunk). Highly valued as a natural antiseptic, expectorant, and vulnerary.",
    imageUrl: "/balsam_peru.png",
    marketAvailability: "Dermatological formulations, cough syrups, and fine perfumery.",
    parts: [
      {
        id: "balsam-resin",
        name: "Resin",
        description: "Balsamic exudate collected from the bark and trunk of Myroxylon balsamum.",
        coordinates: { x: 35, y: 35, width: 30, height: 30 },
        compounds: [
          {
            id: "benzyl-benzoate",
            name: "Benzyl benzoate",
            hide3D: true,
            pharmacologicalActivity: "Antiseptic and vulnerary.",
            therapeuticActivity: "Treatment of minor wounds, burns, and ulcers.",
            structure2DPlaceholder: "https://picsum.photos/seed/benzylbenzoate2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Benzyl benzoate",
            pharmaceuticalAnalysis: {
              molecularWeight: "212.25 g/mol",
              nominalMass: "212 Da",
              isotopeFormula: "C14H12O2",
              massSpectrumUrl: "https://picsum.photos/seed/balsam-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/balsam-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/balsam-cnmr/400/300"
            }
          },
          {
            id: "cinnamic-acid",
            name: "Cinnamic Acid",
            pdbId: "4GM7",
            pharmacologicalActivity: "Antiseptic and expectorant.",
            therapeuticActivity: "Used in cough syrups.",
            structure2DPlaceholder: "https://picsum.photos/seed/cinnamicacid2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Cinnamic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "148.16 g/mol",
              nominalMass: "148 Da",
              isotopeFormula: "C9H8O2",
              massSpectrumUrl: "https://picsum.photos/seed/myroxylon-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/myroxylon-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/myroxylon-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "sumatra-benzoin",
    name: "Kemenyan / Gum Benjamin",
    scientificName: "Styrax species (S. benzoin & S. tonkinensis)",
    synonyms: ["Sumatra Benzoin", "Siam Benzoin", "Gum Benjamin", "Tonkin Benzoin", "Siam Gum Benzoin", "Onycha"],
    description: "Wild tree species belonging to the genus Styrax, native to Southeast Asia (Sumatra, Malaysia, Thailand, Laos, and Vietnam). They yield highly fragrant balsamic resins (Sumatra Benzoin and Siam Benzoin) rich in benzoic acid and coniferyl benzoate, widely used as antiseptics, cosmetics, fine perfumery, and expectorants.",
    imageUrl: "/benzoin_siam.jpg",
    marketAvailability: "Perfumery, cosmetic ingredients, incense, and topical antiseptic formulations.",
    parts: [
      {
        id: "sumatra-resin",
        name: "Tree Resin",
        description: "Balsamic resin extracted from the bark of Styrax species.",
        coordinates: { x: 35, y: 35, width: 30, height: 30 },
        compounds: [
          {
            id: "benzoic-acid",
            name: "Benzoic Acid",
            pdbId: "2Q0I",
            pharmacologicalActivity: "Antiseptic.",
            therapeuticActivity: "Used topically for antiseptic properties.",
            structure2DPlaceholder: "https://picsum.photos/seed/benzoicacid2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Benzoic acid",
            pharmaceuticalAnalysis: {
              molecularWeight: "122.12 g/mol",
              nominalMass: "122 Da",
              isotopeFormula: "C7H6O2",
              massSpectrumUrl: "https://picsum.photos/seed/benzoin-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/benzoin-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/benzoin-cnmr/400/300"
            }
          },
          {
            id: "coniferyl-benzoate",
            name: "Coniferyl benzoate",
            hide3D: true,
            pharmacologicalActivity: "Antiseptic and vulnerary.",
            therapeuticActivity: "Wound healing and perfumery.",
            structure2DPlaceholder: "https://picsum.photos/seed/coniferyl2d/300/200",
            structure3DPlaceholder: "Interactive 3D view",
            pharmaceuticalAnalysis: {
              molecularWeight: "284.3 g/mol",
              nominalMass: "284 Da",
              isotopeFormula: "C17H16O4",
              massSpectrumUrl: "https://picsum.photos/seed/siam-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/siam-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/siam-cnmr/400/300"
            }
          }
        ]
      }
    ]
  },
  {
    id: "wintergreen",
    name: "Wintergreen",
    scientificName: "Gaultheria procumbens (Ericaceae)",
    synonyms: ["Eastern Teaberry", "Checkerberry", "Boxberry"],
    description: "Common damp-region North American plant. The essential oil is obtained from the leaves.",
    imageUrl: "/Wintergreen.jpg",
    marketAvailability: "Wintergreen oil is used in North America in the formulation of oral hygiene and cosmetic products.",
    parts: [
      {
        id: "wintergreen-leaves",
        name: "Leaves",
        description: "Source of wintergreen essential oil.",
        coordinates: { x: 50, y: 50, width: 40, height: 40 },
        compounds: [
          {
            id: "methyl-salicylate",
            name: "Methyl salicylate",
            pharmacologicalActivity: "Anti-inflammatory, analgesic, counter-irritant.",
            therapeuticActivity: "Used topically for muscle and joint pain.",
            structure2DPlaceholder: "https://picsum.photos/seed/methylsalicylate2d/300/200",
            structure3DPlaceholder: "Interactive 3D view for Methyl salicylate",
            pharmaceuticalAnalysis: {
              molecularWeight: "152.15 g/mol",
              nominalMass: "152 Da",
              isotopeFormula: "C8H8O3",
              massSpectrumUrl: "https://picsum.photos/seed/wintergreen-ms/400/300",
              hnmrUrl: "https://picsum.photos/seed/wintergreen-hnmr/400/300",
              cnmrUrl: "https://picsum.photos/seed/wintergreen-cnmr/400/300"
            }
          }
        ]
      }
    ]
  }
];
