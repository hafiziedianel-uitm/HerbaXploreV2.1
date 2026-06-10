import React, { useState, useMemo } from 'react';
import { Plant, PlantPart } from '@/lib/data';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Award, RefreshCcw, ArrowRight, HelpCircle } from 'lucide-react';
import { translateDb } from '@/lib/i18n';

interface PlantQuizProps {
  plant: Plant;
}

type Question = {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export function PlantQuiz({ plant }: PlantQuizProps) {
  const { language } = useLanguage();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Generate dynamic questions based on the selected plant
  const questions = useMemo(() => {
    const q: Question[] = [];
    if (!plant || !plant.parts || plant.parts.length === 0) return q;

    const en = language === 'en';

    // Deterministic pseudo-random sorting based on plant id length
    const sorter = (arr: string[]) => {
      const shift = plant.id.length % arr.length;
      return [...arr.slice(shift), ...arr.slice(0, shift)];
    };

    // 1. Question about plant parts
    const partNames = plant.parts.map(p => translateDb(p.name, language));
    if (plant.parts.length > 0) {
      const options = sorter([
        partNames[0],
        en ? 'Root Bark' : 'Kulit Akar',
        en ? 'Wood Core' : 'Teras Kayu',
        en ? 'Pollen' : 'Debunga'
      ]);

      q.push({
        id: 'q1',
        type: 'multiple-choice',
        question: en ? `Which part of ${plant.name} is predominantly used in traditional medicine or extraction?` : `Bahagian manakah pada ${plant.name} yang paling banyak digunakan dalam perubatan tradisional atau pengekstrakan?`,
        options: options,
        correctAnswer: options.indexOf(partNames[0]),
        explanation: en ? `The ${partNames[0]} is a primary source of therapeutic compounds.` : `${partNames[0]} adalah sumber utama sebatian terapeutik.`
      });
    }

    // Prepare compounds list
    const allCompounds = plant.parts.flatMap(p => p.compounds);
    
    // 2. Question about a specific compound
    if (allCompounds.length > 0) {
      const targetCompound = allCompounds[0];
      const otherCompounds = ['Luteolin', 'Quercetin', 'Gallic Acid', 'Menthol', 'Eugenol'].filter(c => c !== targetCompound.name);
      
      const options = sorter([targetCompound.name, otherCompounds[0], otherCompounds[1], otherCompounds[2]]);
      
      q.push({
        id: 'q2',
        type: 'multiple-choice',
        question: en ? `Which of the following bioactive compounds is a major constituent of ${plant.name}?` : `Antara sebatian bioaktif berikut, manakah merupakan juzuk utama ${plant.name}?`,
        options,
        correctAnswer: options.indexOf(targetCompound.name),
        explanation: en ? `${targetCompound.name} contributes significantly to its pharmacological profile.` : `${targetCompound.name} menyumbang secara ketara kepada profil farmakologinya.`
      });

      // 3. Question about therapeutic activity
      const activity = translateDb(targetCompound.therapeuticActivity, language);
      const fakeActivities = [
        en ? 'Used for blood pressure reduction' : 'Digunakan untuk mengurangkan tekanan darah',
        en ? 'Primarily used to treat bone fractures' : 'Terutamanya digunakan untuk merawat patah tulang',
        en ? 'Acts as a strong surgical anesthetic' : 'Bertindak sebagai anestetik pembedahan yang kuat',
        en ? 'Used for severe vision impairment' : 'Digunakan untuk gangguan penglihatan teruk'
      ].filter(a => a !== activity);

      const actOptions = sorter([activity, fakeActivities[0], fakeActivities[1], fakeActivities[2]]);

      q.push({
        id: 'q3',
        type: 'multiple-choice',
        question: en ? `What is the primary therapeutic activity associated with ${targetCompound.name} found in this plant?` : `Apakah aktiviti terapeutik utama yang dikaitkan dengan ${targetCompound.name} yang terdapat dalam tumbuhan ini?`,
        options: actOptions,
        correctAnswer: actOptions.indexOf(activity),
        explanation: en ? `Extracted compounds like ${targetCompound.name} possess this target therapeutic property.` : `Sebatian terekstrak seperti ${targetCompound.name} mempunyai sifat terapeutik sasaran ini.`
      });
    }

    return q;
  }, [plant, language]);

  if (questions.length === 0) return null;

  const currentQ = questions[currentQuestionIdx];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    setIsAnswered(true);
    
    if (idx === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizComplete(false);
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm mt-8">
      <div className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-bold mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
          <HelpCircle size={20} />
        </div>
        <h3 className="text-xl">{language === 'en' ? 'Knowledge Check' : 'Ujian Pengetahuan'}</h3>
      </div>

      <AnimatePresence mode="wait">
        {!quizComplete ? (
          <motion.div
            key={currentQuestionIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <span>{language === 'en' ? 'Question' : 'Soalan'} {currentQuestionIdx + 1} / {questions.length}</span>
              <span>{language === 'en' ? 'Score' : 'Markah'}: {score}</span>
            </div>

            <p className="text-lg sm:text-xl font-medium text-stone-800 dark:text-stone-100 leading-snug">
              {currentQ.question}
            </p>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                let btnClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 text-sm sm:text-base font-medium flex justify-between items-center ";
                
                if (!isAnswered) {
                  btnClass += "border-stone-200 dark:border-stone-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-stone-700 dark:text-stone-300";
                } else if (idx === currentQ.correctAnswer) {
                  btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200";
                } else if (idx === selectedAnswer) {
                  btnClass += "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200";
                } else {
                  btnClass += "border-stone-100 dark:border-stone-800 text-stone-400 dark:text-stone-600 opacity-50";
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={btnClass}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === currentQ.correctAnswer && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
                    {isAnswered && idx === selectedAnswer && idx !== currentQ.correctAnswer && <XCircle size={20} className="text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-100 dark:border-stone-700/50"
              >
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  <span className="font-bold mr-2 text-stone-800 dark:text-stone-200">{language === 'en' ? 'Explanation:' : 'Penerangan:'}</span> 
                  {currentQ.explanation}
                </p>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-2.5 rounded-lg text-sm font-bold transition-transform hover:scale-105"
                  >
                    {currentQuestionIdx < questions.length - 1 ? (language === 'en' ? 'Next Question' : 'Soalan Seterusnya') : (language === 'en' ? 'See Results' : 'Lihat Keputusan')}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-24 h-24 mx-auto bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-6">
              <Award size={48} />
            </div>
            <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              {language === 'en' ? 'Quiz Complete!' : 'Ujian Selesai!'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {language === 'en' ? `You scored ${score} out of ${questions.length}` : `Anda mendapat markah ${score} daripada ${questions.length}`}
            </p>
            
            <div className="flex justify-center pb-4">
              <button
                onClick={resetQuiz}
                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                <RefreshCcw size={16} />
                {language === 'en' ? 'Retake Quiz' : 'Ulang Ujian'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
