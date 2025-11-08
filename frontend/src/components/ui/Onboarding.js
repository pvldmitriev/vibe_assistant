import { useState } from 'react';

export default function Onboarding({ onComplete, onSkip }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Добро пожаловать в Cursor AI Guide!',
      description: 'Я помогу вам создать проект с помощью Cursor AI — от идеи до деплоя.',
      icon: '🚀'
    },
    {
      title: 'Что мы сделаем вместе?',
      description: (
        <ul className="text-left space-y-2">
          <li>✅ Напишем PRD (Product Requirements Document)</li>
          <li>✅ Настроим правила Cursor для вашего проекта</li>
          <li>✅ Составим план разработки</li>
          <li>✅ Дадим промпты для AI-кодирования</li>
          <li>✅ Поможем задеплоить готовый проект</li>
        </ul>
      ),
      icon: '📝'
    },
    {
      title: 'Ваша роль — отвечать на вопросы',
      description: 'AI задаст вам простые вопросы о вашей идее. Вам не нужны технические знания — просто расскажите что хотите создать!',
      icon: '💡'
    },
    {
      title: 'Готовы начать?',
      description: 'Весь процесс займет 15-20 минут. Вы можете вернуться к любому шагу в любой момент.',
      icon: '🎯'
    }
  ];

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const nextSlide = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    setCurrentSlide(Math.max(0, currentSlide - 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-6">{slide.icon}</div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {slide.title}
          </h2>
          
          <div className="text-lg text-gray-600 mb-8">
            {slide.description}
          </div>

          <div className="flex items-center justify-center space-x-2 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Пропустить
            </button>

            <div className="space-x-3">
              {currentSlide > 0 && (
                <button
                  onClick={prevSlide}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Назад
                </button>
              )}
              
              <button
                onClick={nextSlide}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isLastSlide ? 'Начать!' : 'Далее'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

