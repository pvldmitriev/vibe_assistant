import { useState } from 'react';

export default function ProductVision({ 
  vision, 
  features = [], 
  onAccept, 
  onCorrect,
  loading 
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [corrections, setCorrections] = useState('');
  const [error, setError] = useState('');

  const handleCorrect = () => {
    setError('');
    
    if (!corrections.trim()) {
      setError('Опишите что нужно изменить');
      return;
    }

    onCorrect(corrections);
    setCorrections('');
    setShowCorrection(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📦 Образ вашего продукта
        </h2>

        <div className="prose max-w-none">
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {vision}
            </p>
          </div>

          {features && features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Основные функции MVP:
              </h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {!showCorrection ? (
          <div className="flex gap-4 mt-6">
            <button
              onClick={onAccept}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              ✓ Принять и создать план
            </button>
            <button
              onClick={() => setShowCorrection(true)}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              ✎ Скорректировать
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Что нужно изменить или дополнить?
            </label>
            <textarea
              value={corrections}
              onChange={(e) => setCorrections(e.target.value)}
              placeholder="Например: Добавьте функцию экспорта данных, упростите интерфейс..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleCorrect}
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Обновляем...' : 'Применить корректировки'}
              </button>
              <button
                onClick={() => {
                  setShowCorrection(false);
                  setCorrections('');
                  setError('');
                }}
                disabled={loading}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💡 Совет:</strong> Образ продукта — это то, как будет выглядеть ваш MVP.
            Убедитесь, что он простой и реализуемый. Вы всегда сможете добавить функции позже.
          </p>
        </div>
      </div>
    </div>
  );
}

