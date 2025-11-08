import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ProductVision } from "@/components/ProductVision";
import { IdeaForm } from "@/components/IdeaForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Analysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vision, setVision] = useState(location.state?.vision || "");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleApprove = async () => {
    setIsGeneratingPlan(true);
    
    // Симуляция генерации плана
    setTimeout(() => {
      navigate("/plan", {
        state: {
          vision,
          steps: [
            {
              number: 1,
              title: "Настройка окружения и создание базовой структуры",
              prompt: "Создай React приложение с TypeScript и Tailwind CSS. Настрой базовую структуру проекта с папками для компонентов, страниц и утилит.",
              dod: [
                "Проект успешно запускается на localhost",
                "Настроен TypeScript без ошибок",
                "Подключен и работает Tailwind CSS",
                "Создана базовая файловая структура"
              ]
            },
            {
              number: 2,
              title: "Создание главной страницы и навигации",
              prompt: "Создай главную страницу с навигацией. Добавь Header с логотипом и меню, Hero секцию с описанием продукта и CTA кнопками.",
              dod: [
                "Header отображается на всех страницах",
                "Hero секция корректно отображается",
                "Навигация работает между страницами",
                "Дизайн адаптивен для мобильных устройств"
              ]
            },
            {
              number: 3,
              title: "Реализация основного функционала",
              prompt: "Реализуй основной функционал приложения согласно образу продукта. Создай необходимые компоненты, добавь состояние и обработку пользовательских действий.",
              dod: [
                "Все основные компоненты созданы и работают",
                "Состояние приложения корректно управляется",
                "Обработка действий пользователя функционирует",
                "Добавлена валидация форм"
              ]
            }
          ]
        }
      });
    }, 1500);
  };

  const handleEdit = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4">
      <div className="container mx-auto max-w-5xl space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="group hover:bg-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-smooth" />
          Назад
        </Button>

        {vision ? (
          <ProductVision
            vision={vision}
            onApprove={handleApprove}
            onEdit={handleEdit}
            isLoading={isGeneratingPlan}
          />
        ) : (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Образ продукта не найден
            </h2>
            <p className="text-muted-foreground">
              Начните с описания вашей идеи
            </p>
            <Button onClick={() => navigate("/")}>
              Вернуться на главную
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
