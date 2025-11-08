import { useState } from 'react';

export default function PromptCard({ prompt, title, editable = false, onEdit, showTokenCount = false }) {
  const [editing, setEditing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = () => {
    onEdit(localPrompt);
    setEditing(false);
  };

  const estimateTokens = (text) => {
    // Простая оценка: ~4 символа = 1 токен
    return Math.ceil(text.length / 4);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          {title && <h3 className="text-sm font-medium text-gray-900">{title}</h3>}
          {showTokenCount && (
            <p className="text-xs text-gray-500 mt-1">
              ~{estimateTokens(prompt).toLocaleString()} токенов
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {editable && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Редактировать
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {editing ? (
          <div>
            <textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-sm"
            />
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setLocalPrompt(prompt);
                  setEditing(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 max-h-96 overflow-y-auto">
            {prompt}
          </pre>
        )}
      </div>
    </div>
  );
}

