import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateNote } from "@/hooks/use-notes";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const [content, setContent] = useState("");
  const [, setLocation] = useLocation();
  const { mutate: createNote, isPending } = useCreateNote();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createNote({ content }, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full py-4">
      <div className="mb-8 px-2">
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center">
          <FileText className="w-8 h-8 mr-3 text-primary" />
          Add Notes
        </h2>
        <p className="text-muted-foreground mt-2 text-balance">
          Paste your study materials, lecture notes, or textbook excerpts here. We'll automatically generate active recall questions for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 relative">
        <div className="flex-1 relative group">
          <div className="absolute -inset-1 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" />
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing or pasting your notes here..."
            className="w-full h-full min-h-[300px] p-6 bg-card text-foreground placeholder:text-muted-foreground/60 border border-border/60 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-shadow text-lg leading-relaxed"
            disabled={isPending}
          />
        </div>

        <Button
          type="submit"
          disabled={!content.trim() || isPending}
          className="w-full h-16 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/10 active-press transition-all hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Processing Concepts...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-3" />
              Generate Flashcards
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
