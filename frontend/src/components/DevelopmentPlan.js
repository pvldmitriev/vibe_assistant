import StepCard from './StepCard';
import StepProgress from './StepProgress';

export default function DevelopmentPlan({ 
  steps = [], 
  progress = { total: 0, completed: 0 },
  onStepComplete,
  onStepUncomplete 
}) {
  if (!steps || steps.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500">План разработки пока не создан</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📋 План разработки
          </h2>
          <StepProgress 
            total={progress.total} 
            completed={progress.completed} 
          />
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              onComplete={() => onStepComplete(step.id)}
              onUncomplete={() => onStepUncomplete(step.id)}
            />
          ))}
        </div>

        {progress.completed === progress.total && progress.total > 0 && (
          <div className="mt-6 p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Поздравляем! Все шаги выполнены!
            </h3>
            <p className="text-green-700">
              Ваш MVP готов. Теперь можно протестировать его и собрать первую обратную связь от пользователей.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

