import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IdeaForm } from "@/components/IdeaForm";
import { Sparkles, Zap, Target } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleIdeaSubmit = async (idea: string) => {
    setIsAnalyzing(true);

    // Симуляция AI анализа
    setTimeout(() => {
      const mockVision = `На основе вашей идеи, предлагаю создать MVP со следующими характеристиками:

🎯 Целевая аудитория:
Пользователи, которые хотят улучшить свои привычки и достичь целей с помощью геймификации.

💡 Ключевые функции MVP:
1. Создание и отслеживание привычек
2. Ежедневные напоминания
3. Система достижений и наград
4. Визуализация прогресса
5. Простая статистика

🚀 Техническая реализация:
- Веб-приложение на React
- Локальное хранилище данных (localStorage)
- Адаптивный дизайн для мобильных устройств

📊 Метрики успеха:
- Пользователи создают минимум 3 привычки
- Возвращаемость пользователей на следующий день >30%
- Время до первого достижения <7 дней

Этот MVP можно реализовать за 3-5 дней разработки.`;

      setIsAnalyzing(false);
      navigate("/analysis", { state: { vision: mockVision, idea } });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Powered by AI
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Vibe Assistant
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ИИ-наставник для вайбкодинга. От идеи до первого MVP за несколько шагов
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="bg-gradient-card p-6 rounded-xl border border-border/50 shadow-soft hover:shadow-elegant transition-smooth">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Анализ идеи
              </h3>
              <p className="text-sm text-muted-foreground">
                AI анализирует вашу идею и создает образ продукта
              </p>
            </div>

            <div className="bg-gradient-card p-6 rounded-xl border border-border/50 shadow-soft hover:shadow-elegant transition-smooth">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Пошаговый план
              </h3>
              <p className="text-sm text-muted-foreground">
                Получите детальный план разработки с готовыми промптами
              </p>
            </div>

            <div className="bg-gradient-card p-6 rounded-xl border border-border/50 shadow-soft hover:shadow-elegant transition-smooth">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Быстрый старт
              </h3>
              <p className="text-sm text-muted-foreground">
                От идеи до первого MVP без глубоких технических знаний
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <IdeaForm onSubmit={handleIdeaSubmit} isLoading={isAnalyzing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
