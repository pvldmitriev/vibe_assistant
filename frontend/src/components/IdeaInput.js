import { useState } from 'react';

export default function IdeaInput({ onSubmit, loading }) {
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    setError('');

    if (!idea.trim()) {
      setError('Пожалуйста, опишите вашу идею');
      return;
    }

    if (idea.length < 20) {
      setError('Опишите идею подробнее (минимум 20 символов)');
      return;
    }

    if (idea.length > 2000) {
      setError('Описание слишком длинное (максимум 2000 символов)');
      return;
    }

    onSubmit(idea);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Опишите вашу идею
        </h2>
        <p className="text-gray-600 mb-6">
          Расскажите о проблеме, которую хотите решить, или о продукте, который хотите создать.
          Мы поможем вам превратить идею в работающий MVP.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Например: Я хочу создать приложение для ведения дневника настроения с AI-анализом эмоций..."
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            disabled={loading}
          />

          <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
            <span>{idea.length} / 2000 символов</span>
            {idea.length >= 20 && (
              <span className="text-green-600">✓ Достаточно подробно</span>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className="mt-6 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Анализируем идею...
              </span>
            ) : (
              'Анализировать идею'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Примеры идей:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Приложение для учета расходов с автоматической категоризацией</li>
            <li>• Платформа для поиска удаленной работы для разработчиков</li>
            <li>• Сервис для создания персонализированных рекомендаций книг</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

