import { useState } from 'react';

export default function StepCard({ step, onComplete, onUncomplete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(step.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggleComplete = () => {
    if (step.completed) {
      onUncomplete();
    } else {
      onComplete();
    }
  };

  return (
    <div 
      className={`border rounded-lg transition-all duration-200 ${
        step.completed 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:border-primary-300'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            className="mt-1 flex-shrink-0"
          >
            <div 
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                step.completed 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-gray-300 hover:border-primary-500'
              }`}
            >
              {step.completed && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${
                    step.completed ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    Шаг {step.order}
                  </span>
                  {step.estimatedMinutes && (
                    <span className="text-xs text-gray-400">
                      ~{step.estimatedMinutes} мин
                    </span>
                  )}
                </div>
                <h3 className={`text-lg font-semibold ${
                  step.completed ? 'text-green-800 line-through' : 'text-gray-800'
                }`}>
                  {step.title}
                </h3>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg 
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    isExpanded ? 'transform rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-4 space-y-4">
                {/* Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Промпт для IDE:
                    </label>
                    <button
                      onClick={handleCopyPrompt}
                      className="text-sm px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-md transition-colors flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Скопировано!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                          Копировать
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                    {step.prompt}
                  </pre>
                </div>

                {/* DoD */}
                {step.dod && step.dod.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Definition of Done (Критерии готовности):
                    </label>
                    <ul className="space-y-2">
                      {step.dod.map((criterion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-primary-600 mt-0.5">✓</span>
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

