import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Plan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const steps = location.state?.steps || [];
  const vision = location.state?.vision || "";

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStepComplete = (stepNumber: number) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  const progress = (completedSteps.size / steps.length) * 100;

  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            План разработки не найден
          </h2>
          <p className="text-muted-foreground">
            Начните с описания вашей идеи
          </p>
          <Button onClick={() => navigate("/")}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4">
      <div className="container mx-auto max-w-5xl space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/analysis", { state: { vision } })}
          className="group hover:bg-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-smooth" />
          Назад
        </Button>

        <Card className="p-8 bg-gradient-card shadow-elegant border-border/50">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                План разработки
              </h1>
              <p className="text-muted-foreground">
                Следуйте этим шагам для создания вашего продукта
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Прогресс</span>
                <span className="font-medium text-foreground">
                  {completedSteps.size} из {steps.length} шагов
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {progress === 100 && (
              <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Поздравляем! Все шаги выполнены</span>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {steps.map((step: any) => (
            <StepCard
              key={step.number}
              step={step}
              completed={completedSteps.has(step.number)}
              onToggleComplete={() => toggleStepComplete(step.number)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Plan;
