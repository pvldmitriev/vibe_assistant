export default function LoadingSpinner({ text = 'Загрузка...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      {text && (
        <p className="mt-4 text-gray-600">{text}</p>
      )}
    </div>
  );
}

