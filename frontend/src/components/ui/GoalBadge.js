import Tooltip from './Tooltip';

export default function GoalBadge({ goal }) {
  if (!goal) return null;

  const goalEmoji = {
    'Обучение и практика': '📚',
    'Использовать самому': '🛠️',
    'Для пользователей': '🚀',
    'Портфолио': '💼'
  };

  return (
    <div className="fixed top-4 right-4 z-40 bg-white shadow-lg rounded-lg px-4 py-2 border border-gray-200">
      <Tooltip content="Влияет на правила, тесты и деплой">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{goalEmoji[goal] || '🎯'}</span>
          <div>
            <p className="text-xs text-gray-500">Цель проекта:</p>
            <p className="text-sm font-medium text-gray-900">{goal}</p>
          </div>
        </div>
      </Tooltip>
    </div>
  );
}

