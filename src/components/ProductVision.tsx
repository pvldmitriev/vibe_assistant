import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit3, ArrowRight } from "lucide-react";

interface ProductVisionProps {
  vision: string;
  onApprove: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}

export const ProductVision = ({ vision, onApprove, onEdit, isLoading }: ProductVisionProps) => {
  return (
    <Card className="w-full max-w-3xl mx-auto p-8 bg-gradient-card shadow-elegant border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Образ продукта
          </h2>
          <p className="text-sm text-muted-foreground">
            AI проанализировал вашу идею и предлагает следующий образ MVP
          </p>
        </div>

        <div className="prose prose-sm max-w-none">
          <div className="bg-background/50 rounded-lg p-6 border border-border/50">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {vision}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1 group border-border hover:border-primary transition-smooth"
            disabled={isLoading}
          >
            <Edit3 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-smooth" />
            Скорректировать
          </Button>
          <Button
            onClick={onApprove}
            className="flex-1 bg-gradient-primary hover:opacity-90 shadow-elegant transition-smooth group"
            disabled={isLoading}
          >
            Утвердить и создать план
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-smooth" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
