const categoryInfo = {
  WEB_APP: { label: 'Web приложение', emoji: '🌐', color: 'blue' },
  BOT: { label: 'Telegram бот', emoji: '🤖', color: 'purple' },
  MOBILE_APP: { label: 'Мобильное приложение', emoji: '📱', color: 'green' }
};

export default function CategoryBadge({ category }) {
  const info = categoryInfo[category];
  
  if (!info) return null;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    green: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[info.color]}`}>
      <span className="mr-2">{info.emoji}</span>
      {info.label}
    </span>
  );
}

