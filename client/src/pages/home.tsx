import { useState, useEffect } from "react";
import { useDailyQuestion, useReviewQuestion } from "@/hooks/use-questions";
import { MemoryStatus } from "@/components/memory-status";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Brain, Loader2, Sparkles, Check, X, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: question, isLoading, isFetching } = useDailyQuestion();
  const { mutate: submitReview, isPending: isSubmitting } = useReviewQuestion();
  const [isRevealed, setIsRevealed] = useState(false);
  const [prevQuestionId, setPrevQuestionId] = useState<number | null>(null);

  // Reset reveal state when a new question arrives
  useEffect(() => {
    if (question && question.id !== prevQuestionId) {
      setIsRevealed(false);
      setPrevQuestionId(question.id);
    }
  }, [question, prevQuestionId]);

  // Trigger confetti if we just finished all reviews
  useEffect(() => {
    if (!isLoading && !isFetching && !question && prevQuestionId !== null) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1db954', '#e25d36', '#111111']
      });
      setPrevQuestionId(null);
    }
  }, [question, isLoading, isFetching, prevQuestionId]);

  const handleReview = (quality: number) => {
    if (!question) return;
    submitReview({ id: question.id, data: { quality } });
  };

  const reviewButtons = [
    { label: "Blackout", value: 0, color: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200", icon: X },
    { label: "Hard", value: 2, color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200", icon: HelpCircle },
    { label: "Good", value: 4, color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200", icon: Check },
    { label: "Perfect", value: 5, color: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200", icon: Sparkles },
  ];

  return (
    <div className="flex-1 flex flex-col w-full h-full space-y-10 items-center justify-center">
      <div className="w-full pt-4">
        <MemoryStatus />
      </div>

      <div className="flex-1 flex flex-col w-full items-center justify-center min-h-[400px]">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center text-muted-foreground"
          >
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Finding your optimal review...</p>
          </motion.div>
        ) : !question ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center text-center max-w-sm px-6 py-12 bg-white rounded-3xl shadow-xl shadow-black/5 border border-border/50"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-[#1db954]" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">You're all caught up!</h2>
            <p className="text-muted-foreground mb-8 text-balance">
              Your memory is secure for today. Add more notes to continue expanding your knowledge base.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`q-${question.id}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full max-w-lg bg-card rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 border border-border/50 flex flex-col relative overflow-hidden"
            >
              {/* Question Section */}
              <div className="mb-8 relative z-10">
                <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider uppercase bg-secondary text-secondary-foreground rounded-full">
                  Question
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-semibold leading-tight text-foreground">
                  {question.questionText}
                </h3>
              </div>

              {/* Answer & Controls Section */}
              <div className="flex-1 flex flex-col justify-end min-h-[160px] relative z-10">
                {!isRevealed ? (
                  <Button 
                    onClick={() => setIsRevealed(true)}
                    className="w-full h-14 text-base rounded-2xl active-press shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    Reveal Answer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col space-y-8"
                  >
                    <div className="p-5 bg-secondary/50 rounded-2xl border border-border/50">
                      <p className="text-lg text-foreground/90 font-medium leading-relaxed">
                        {question.answerText}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        How well did you recall this?
                      </p>
                      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
                        {reviewButtons.map((btn) => (
                          <Button
                            key={btn.label}
                            onClick={() => handleReview(btn.value)}
                            disabled={isSubmitting}
                            variant="outline"
                            className={`flex-1 h-14 sm:h-16 flex flex-col items-center justify-center rounded-2xl border active-press transition-colors ${btn.color}`}
                          >
                            <btn.icon className="w-5 h-5 mb-1 opacity-80" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{btn.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
