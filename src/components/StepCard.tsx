import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface StepCardProps {
  step: {
    number: number;
    title: string;
    prompt: string;
    dod: string[];
  };
  completed: boolean;
  onToggleComplete: () => void;
}

export const StepCard = ({ step, completed, onToggleComplete }: StepCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(step.prompt);
    toast.success("Промпт скопирован в буфер обмена");
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-soft border-border/50 hover:shadow-elegant transition-smooth">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={completed}
            onCheckedChange={onToggleComplete}
            className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                    Шаг {step.number}
                  </span>
                  {completed && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mt-2">
                  {step.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-secondary"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {isExpanded && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      Промпт для IDE
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyPrompt}
                      className="hover:bg-secondary group"
                    >
                      <Copy className="w-3 h-3 mr-1 group-hover:scale-110 transition-smooth" />
                      Копировать
                    </Button>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                    <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                      {step.prompt}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Definition of Done
                  </h4>
                  <ul className="space-y-2">
                    {step.dod.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
