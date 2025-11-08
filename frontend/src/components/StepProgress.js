export default function StepProgress({ total = 0, completed = 0 }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Прогресс выполнения
        </span>
        <span className="text-sm font-semibold text-primary-600">
          {completed} / {total} шагов
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && (
            <span className="flex items-center justify-center h-full text-xs text-white font-medium">
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {percentage === 100 && total > 0 && (
        <p className="mt-2 text-sm text-green-600 font-medium">
          🎉 Все шаги выполнены!
        </p>
      )}
    </div>
  );
}

