import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";

interface IdeaFormProps {
  onSubmit: (idea: string) => void;
  isLoading?: boolean;
}

export const IdeaForm = ({ onSubmit, isLoading }: IdeaFormProps) => {
  const [idea, setIdea] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onSubmit(idea);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-8 bg-gradient-card shadow-elegant border-border/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="idea" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Опишите вашу идею
          </label>
          <Textarea
            id="idea"
            placeholder="Например: Хочу создать приложение для отслеживания привычек с геймификацией..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="min-h-[200px] resize-none text-base bg-background/50 border-border focus:border-primary transition-smooth"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Чем подробнее вы опишете идею, тем точнее будет анализ
          </p>
        </div>

        <Button
          type="submit"
          disabled={!idea.trim() || isLoading}
          className="w-full bg-gradient-primary hover:opacity-90 shadow-elegant transition-smooth group"
          size="lg"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Анализирую...
            </>
          ) : (
            <>
              Анализировать идею
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-smooth" />
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
