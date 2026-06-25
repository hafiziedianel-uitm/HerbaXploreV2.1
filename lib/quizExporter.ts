import { plantsData, getCompoundBioactiveClass } from './data';
import { translateDb } from './i18n';

interface ExportedQuestion {
  questionNumber: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface PlantQAExport {
  scientificName: string;
  vernacularName: string;
  family: string;
  questions: ExportedQuestion[];
}

// Replicate the deterministic sorter used in PlantQuiz.tsx
function getDeterministicOptions(plantId: string, arr: string[]): string[] {
  const shift = plantId.length % arr.length;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

export function compileAllQuizQuestions(lang: 'en' | 'ms'): string {
  const isEn = lang === 'en';
  const lines: string[] = [];

  lines.push("================================================================================0");
  lines.push(`HERBAXPLORER: KNOWLEDGE CHECKER COMPLETE Q&A DATABASE (${isEn ? 'ENGLISH' : 'BAHASA MELAYU'})`);
  lines.push("FACULTY OF PHARMACY, UNIVERSITI TEKNOLOGI MARA (UiTM)");
  lines.push("================================================================================0\n");

  lines.push(`Target Subject : Pharmacognosy (PHC614)`);
  lines.push(`Total Plants   : ${plantsData.length} Species`);
  lines.push(`Generated On   : ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push(`Purpose        : External verification, quality assurance, curriculum panel audit.`);
  lines.push("--------------------------------------------------------------------------------\n");

  plantsData.forEach((plant, index) => {
    const pName = translateDb(plant.name, lang);
    const pFamily = plant.family || "N/A";
    
    lines.push(`[${index + 1}] SPECIES: ${plant.scientificName} (${pName})`);
    lines.push(`    Family: ${pFamily}`);
    lines.push(`    ----------------------------------------------------------------------------`);

    if (!plant.parts || plant.parts.length === 0) {
      lines.push("    (No quiz data available for this plant)\n");
      return;
    }

    let qCounter = 1;

    // 1. Question about plant parts
    const partNames = plant.parts.map(p => translateDb(p.name, lang));
    if (plant.parts.length > 0) {
      let targetPartName = partNames[0];
      if (plant.id === 'misai-kucing') {
        const leavesIdx = plant.parts.findIndex(p => p.id === 'leaves' || p.id.includes('leaves'));
        if (leavesIdx !== -1) {
          targetPartName = partNames[leavesIdx];
        }
      }

      const partOptions = getDeterministicOptions(plant.id, [
        targetPartName,
        isEn ? 'Root' : 'Akar',
        isEn ? 'Wood/Bark/Stem' : 'Kayu/Kulit/Batang',
        isEn ? 'Pollen' : 'Debunga'
      ]);

      const correctAnsIdx = partOptions.indexOf(targetPartName);
      const correctLetter = String.fromCharCode(65 + correctAnsIdx); // A, B, C, D

      lines.push(`    Q${qCounter}: ${isEn ? `Which part of ${pName} is predominantly used in traditional medicine?` : `Bahagian manakah pada ${pName} yang paling banyak digunakan dalam perubatan tradisional?`}`);
      partOptions.forEach((opt, idx) => {
        lines.push(`       ${String.fromCharCode(65 + idx)}) ${opt}`);
      });
      lines.push(`    👉  CORRECT ANSWER: ${correctLetter} (${targetPartName})`);
      lines.push(`       EXPLANATION: ${isEn ? `The ${targetPartName} is a primary source of therapeutic compounds.` : `${targetPartName} adalah sumber utama sebatian terapeutik.`}`);
      lines.push("");
      qCounter++;
    }

    // Compounds questions
    const allCompounds = plant.parts.flatMap(p => p.compounds);
    if (allCompounds.length > 0) {
      const targetCompound = allCompounds[0];

      // 2. Question about specific compound major constituent
      const otherCompounds = ['Luteolin', 'Quercetin', 'Gallic Acid', 'Menthol', 'Eugenol'].filter(c => c !== targetCompound.name);
      const cmpOptions = getDeterministicOptions(plant.id, [targetCompound.name, otherCompounds[0], otherCompounds[1], otherCompounds[2]]);
      const ansIdx2 = cmpOptions.indexOf(targetCompound.name);
      const letter2 = String.fromCharCode(65 + ansIdx2);

      lines.push(`    Q${qCounter}: ${isEn ? `Which of the following bioactive compounds is a major constituent of ${pName}?` : `Antara sebatian bioaktif berikut, manakah merupakan juzuk utama ${pName}?`}`);
      cmpOptions.forEach((opt, idx) => {
        lines.push(`       ${String.fromCharCode(65 + idx)}) ${opt}`);
      });
      lines.push(`    👉  CORRECT ANSWER: ${letter2} (${targetCompound.name})`);
      lines.push(`       EXPLANATION: ${isEn ? `${targetCompound.name} contributes significantly to its pharmacological profile.` : `${targetCompound.name} menyumbang secara ketara kepada profil farmakologinya.`}`);
      lines.push("");
      qCounter++;

      // 3. Therapeutic activity question
      const activity = translateDb(targetCompound.therapeuticActivity, lang);
      const fakeActivities = [
        isEn ? 'Used for blood pressure reduction' : 'Digunakan untuk mengurangkan tekanan darah',
        isEn ? 'Primarily used to treat bone fractures' : 'Terutamanya digunakan untuk merawat patah tulang',
        isEn ? 'Acts as a strong surgical anesthetic' : 'Bertindak sebagai anestetik pembedahan yang kuat',
        isEn ? 'Used for severe vision impairment' : 'Digunakan untuk gangguan penglihatan teruk'
      ].filter(a => a !== activity);

      const actOptions = getDeterministicOptions(plant.id, [activity, fakeActivities[0], fakeActivities[1], fakeActivities[2]]);
      const ansIdx3 = actOptions.indexOf(activity);
      const letter3 = String.fromCharCode(65 + ansIdx3);

      lines.push(`    Q${qCounter}: ${isEn ? `What is the primary therapeutic activity associated with ${targetCompound.name} found in this plant?` : `Apakah aktiviti terapeutik utama yang dikaitkan dengan ${targetCompound.name} yang terdapat dalam tumbuhan ini?`}`);
      actOptions.forEach((opt, idx) => {
        lines.push(`       ${String.fromCharCode(65 + idx)}) ${opt}`);
      });
      lines.push(`    👉  CORRECT ANSWER: ${letter3} (${activity})`);
      lines.push(`       EXPLANATION: ${isEn ? `Extracted compounds like ${targetCompound.name} possess this target therapeutic property.` : `Sebatian terekstrak seperti ${targetCompound.name} mempunyai sifat terapeutik sasaran ini.`}`);
      lines.push("");
      qCounter++;

      // 4. Functional groups
      if (targetCompound.functionalGroups && targetCompound.functionalGroups.length > 0) {
        const targetGroup = targetCompound.functionalGroups[0];
        const allOtherGroups = [
          isEn ? "Amide linkage" : "Ikatan Amida",
          isEn ? "Sulfate ester" : "Ester sulfat",
          isEn ? "Primary amine" : "Amina primer",
          isEn ? "Thiol group" : "Kumpulan Tiol"
        ].filter(g => g !== targetGroup.name);

        const fgOptions = getDeterministicOptions(plant.id, [targetGroup.name, allOtherGroups[0], allOtherGroups[1], allOtherGroups[2]]);
        const ansIdx4 = fgOptions.indexOf(targetGroup.name);
        const letter4 = String.fromCharCode(65 + ansIdx4);

        lines.push(`    Q${qCounter}: ${isEn ? `Which functional group in ${targetCompound.name} is described as: "${targetGroup.description}"?` : `Manakah kumpulan berfungsi dalam ${targetCompound.name} yang diterangkan sebagai: "${targetGroup.description}"?`}`);
        fgOptions.forEach((opt, idx) => {
          lines.push(`       ${String.fromCharCode(65 + idx)}) ${opt}`);
        });
        lines.push(`    👉  CORRECT ANSWER: ${letter4} (${targetGroup.name})`);
        lines.push(`       EXPLANATION: ${isEn ? `The ${targetGroup.name} plays a critical role in the molecule's chemical behavior.` : `${targetGroup.name} memainkan peranan penting dalam sifat kimia molekul.`}`);
        lines.push("");
        qCounter++;
      }

      // 5. Key facts
      if (targetCompound.keyFact) {
        const fact = targetCompound.keyFact;
        const fakeFacts = [
          isEn ? "It is purely synthetic and never found in nature." : "Ia adalah sintetik sepenuhnya dan tidak pernah ditemui dalam alam semula jadi.",
          isEn ? "It is a heavy metal complex." : "Ia merupakan kompleks logam berat.",
          isEn ? "It functions primarily to dissolve plant roots." : "Fungsi utamanya adalah untuk melarutkan akar tumbuhan.",
          isEn ? "It is highly volatile and boils at room temperature." : "Ia sangat meruap dan mendidih pada suhu bilik."
        ];

        const factOptions = getDeterministicOptions(plant.id, [fact, fakeFacts[0], fakeFacts[1], fakeFacts[2]]);
        const ansIdx5 = factOptions.indexOf(fact);
        const letter5 = String.fromCharCode(65 + ansIdx5);

        lines.push(`    Q${qCounter}: ${isEn ? `Which of the following describes a key structural or historical fact about ${targetCompound.name}?` : `Manakah antara berikut menerangkan fakta struktur atau sejarah utama tentang ${targetCompound.name}?`}`);
        factOptions.forEach((opt, idx) => {
          lines.push(`       ${String.fromCharCode(65 + idx)}) ${opt}`);
        });
        lines.push(`    👉  CORRECT ANSWER: ${letter5} (${fact})`);
        lines.push(`       EXPLANATION: ${isEn ? `This is a unique characteristic of ${targetCompound.name}.` : `Ini adalah ciri unik bagi ${targetCompound.name}.`}`);
        lines.push("");
        qCounter++;
      }

      // 6. Chemical classification
      const classes = getCompoundBioactiveClass(targetCompound);
      if (classes.length > 0) {
        const primaryClass = classes[0];
        const allPossibleClasses = ["Flavonoid", "Alkaloid", "Fatty Acid", "Polysaccharide / Gum", "Glycoside", "Phenylpropene / Aldehyde", "Phenolic derivative / Organic Acid"];
        const fakeClasses = allPossibleClasses.filter(c => c !== primaryClass);
        const classOptions = getDeterministicOptions(plant.id, [primaryClass, fakeClasses[0], fakeClasses[1], fakeClasses[2]]);
        const ansIdx6 = classOptions.indexOf(primaryClass);
        const letter6 = String.fromCharCode(65 + ansIdx6);

        lines.push(`    Q${qCounter}: ${isEn ? `Which chemical class does ${targetCompound.name} primarily belong to?` : `Golongan kimia manakah yang paling tepat untuk ${targetCompound.name}?`}`);
        classOptions.forEach((opt, idx) => {
          lines.push(`       ${String.fromCharCode(65 + idx)}) ${opt}`);
        });
        lines.push(`    👉  CORRECT ANSWER: ${letter6} (${primaryClass})`);
        lines.push(`       EXPLANATION: ${isEn ? `${targetCompound.name} is classified as a ${primaryClass} based on its structure.` : `${targetCompound.name} diklasifikasikan sebagai ${primaryClass} berdasarkan strukturnya.`}`);
        lines.push("");
        qCounter++;

        // 7. Characterisation test
        let testQuestionOpt: string[] | null = null;
        let testQuestionText = "";
        let correctTestAns = "";
        let testExplanation = "";

        if (classes.includes("Flavonoid")) {
          testQuestionOpt = getDeterministicOptions(plant.id, [
            isEn ? "Cyanidin reaction (produces red/orange/purple color)" : "Tindak balas sianidin (menghasilkan warna merah/oren/ungu)",
            isEn ? "Bornträger reaction (produces red color in alkaline medium)" : "Tindak balas Bornträger (menghasilkan warna merah dalam medium alkali)",
            isEn ? "Bate-Smith reaction (produces red color upon hydrolysis)" : "Tindak balas Bate-Smith (menghasilkan warna merah apabila dihidrolisis)",
            isEn ? "Alkaloidal precipitation test (Mayer's reagent)" : "Ujian pemendakan alkaloid (reagen Mayer)"
          ]);
          testQuestionText = isEn ? `According to lecture notes, which specific test is used to characterise flavonoids like ${targetCompound.name}?` : `Menurut nota kuliah, ujian manakah yang khusus digunakan untuk mencirian flavonoid seperti ${targetCompound.name}?`;
          correctTestAns = isEn ? "Cyanidin reaction (produces red/orange/purple color)" : "Tindak balas sianidin (menghasilkan warna merah/oren/ungu)";
          testExplanation = isEn ? `The "cyanidin reaction" is a specific coloured reaction for flavonoids stricto sensu, yielding flavylium ions.` : `Tindak balas "sianidin" adalah khusus untuk flavonoid, menghasilkan ion flavilium berwarna.`;
        } else if (classes.includes("Phenolic derivative / Organic Acid")) {
          testQuestionOpt = getDeterministicOptions(plant.id, [
            isEn ? "Ferric chloride (FeCl3) test (yields dark blue/green color)" : "Ujian ferik klorida (FeCl3) (menghasilkan warna biru/hijau gelap)",
            isEn ? "Dragendorff's Test (yields orange precipitate)" : "Ujian Dragendorff (menghasilkan mendakan oren)",
            isEn ? "Bornträger reaction" : "Tindak balas Bornträger",
            isEn ? "Froth test" : "Ujian buih"
          ]);
          testQuestionText = isEn ? `Which general qualitative test is most appropriate for a phenolic compound like ${targetCompound.name}?` : `Ujian kualitatif umum manakah yang paling sesuai untuk sebatian fenolik seperti ${targetCompound.name}?`;
          correctTestAns = isEn ? "Ferric chloride (FeCl3) test (yields dark blue/green color)" : "Ujian ferik klorida (FeCl3) (menghasilkan warna biru/hijau gelap)";
          testExplanation = isEn ? `Phenolics can be detected through colored reactions with ferric chloride (FeCl3).` : `Sebatian fenolik boleh dikesan melalui tindak balas warna dengan ferik klorida (FeCl3).`;
        }

        if (testQuestionOpt) {
          const ansIdx7 = testQuestionOpt.indexOf(correctTestAns);
          const letter7 = String.fromCharCode(65 + ansIdx7);

          lines.push(`    Q${qCounter}: ${testQuestionText}`);
          testQuestionOpt.forEach((opt, idx) => {
            lines.push(`       ${String.fromCharCode(65 + idx)}) ${opt}`);
          });
          lines.push(`    👉  CORRECT ANSWER: ${letter7} (${correctTestAns})`);
          lines.push(`       EXPLANATION: ${testExplanation}`);
          lines.push("");
          qCounter++;
        }
      }
    }

    lines.push("\n");
  });

  return lines.join("\n");
}

export function compileDualLanguageDocument(): string {
  const separator = "\n" + "=".repeat(80) + "\n" + "=".repeat(80) + "\n\n";
  const enDoc = compileAllQuizQuestions('en');
  const msDoc = compileAllQuizQuestions('ms');

  return [
    "================================================================================",
    "HERBAXPLORER: THE COMPLETE PHARMACOGNOSY KNOWLEDGE CHECKER Q&A DATABASE",
    "FACULTY OF PHARMACY, UNIVERSITI TEKNOLOGI MARA (UiTM)",
    "================================================================================",
    "Contains both English and Bahasa Melayu versions compiled for external verification.",
    "\n",
    enDoc,
    separator,
    msDoc
  ].join("\n");
}
