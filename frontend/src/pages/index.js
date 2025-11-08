import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import apiClient from '../services/apiClient';
import Onboarding from '../components/ui/Onboarding';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import GoalBadge from '../components/ui/GoalBadge';
import CategoryBadge from '../components/ui/CategoryBadge';
import PromptCard from '../components/ui/PromptCard';
import InstructionBox from '../components/ui/InstructionBox';
import CommandBox from '../components/ui/CommandBox';
import { Checklist, CheckItem } from '../components/ui/Checklist';
import ExportButton from '../components/ui/ExportButton';

export default function Home() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Session state
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step data
  const [ideaDescription, setIdeaDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [baseQuestions, setBaseQuestions] = useState([]);
  const [baseAnswers, setBaseAnswers] = useState({});
  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState({});
  const [prd, setPrd] = useState('');
  const [prompts, setPrompts] = useState({});
  const [projectGoal, setProjectGoal] = useState('');
  const [debugPrompt, setDebugPrompt] = useState('');
  const [errorDescription, setErrorDescription] = useState('');

  // UI state
  const [processingStep, setProcessingStep] = useState(false);
  const [promptsOutdated, setPromptsOutdated] = useState(false);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Проверяем есть ли сохраненная сессия
      const savedSessionId = localStorage.getItem('cursor-guide-session');
      
      // Загружаем базовые вопросы (всегда, независимо от сессии)
      const questions = await apiClient.getBaseQuestions();
      setBaseQuestions(questions);

      if (savedSessionId) {
        try {
          const existingSession = await apiClient.getSession(savedSessionId);
          
          if (existingSession) {
            // Восстанавливаем сессию
            setSession(existingSession);
            setCurrentStep(existingSession.currentStep || 1);
            setIdeaDescription(existingSession.ideaDescription || '');
            setCategory(existingSession.category);
            setBaseAnswers(existingSession.baseAnswers || {});
            setAdaptiveQuestions(existingSession.adaptiveQuestions || []);
            setAdaptiveAnswers(existingSession.adaptiveAnswers || {});
            setPrd(existingSession.prd || '');
            setPrompts(existingSession.prompts || {});
            setProjectGoal(existingSession.projectGoal || '');
            
            setLoading(false);
            return;
          }
        } catch (sessionError) {
          // Сессия не найдена (404) - это нормально, создадим новую
          // Очищаем невалидный ID из localStorage
          localStorage.removeItem('cursor-guide-session');
          console.log('Сессия не найдена, создаем новую:', sessionError.message);
        }
      }

      // Создаем новую сессию
      const newSession = await apiClient.createSession();
      setSession(newSession);
      localStorage.setItem('cursor-guide-session', newSession.id);
      
      // Показываем onboarding для новых пользователей
      const hasSeenOnboarding = localStorage.getItem('cursor-guide-onboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Ошибка инициализации сессии:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const updateSessionData = async (updates) => {
    if (!session) return;
    
    try {
      const updatedSession = await apiClient.updateSession(session.id, updates);
      setSession(updatedSession);
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const handleStartOver = async () => {
    if (!confirm('Вы уверены? Весь прогресс будет потерян.')) return;
    
    try {
      await apiClient.resetSession(session.id);
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('cursor-guide-onboarding', 'true');
    setShowOnboarding(false);
  };

  const goToStep = (step) => {
    setCurrentStep(step);
    updateSessionData({ currentStep: step });
  };

  const nextStep = () => {
    let next = currentStep + 1;
    // Step 8 → Step 10 (пропускаем Step 9, он доступен только после Step 10)
    if (currentStep === 8) {
      next = 10;
    }
    goToStep(next);
  };

  const prevStep = () => {
    let prev = currentStep - 1;
    // Step 10 → Step 8 (пропускаем Step 9 при возврате назад)
    if (currentStep === 10) {
      prev = 8;
    }
    prev = Math.max(1, prev);
    goToStep(prev);
  };

  // Step 2: Category selection
  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    updateSessionData({ category: selectedCategory });
  };

  const handleIdeaDescriptionChange = (value) => {
    setIdeaDescription(value);
    updateSessionData({ ideaDescription: value });
  };

  // Step 3: Base questions
  const handleBaseAnswersSubmit = async () => {
    try {
      setProcessingStep(true);
      setError(null);
      
      const validation = await apiClient.validateAnswers(baseAnswers);
      
      if (!validation.valid) {
        setError(validation.errors.map(e => e.message).join(', '));
        setProcessingStep(false);
        return;
      }
      
      // Сохраняем цель проекта
      setProjectGoal(baseAnswers.goal);
      
      await updateSessionData({ baseAnswers, projectGoal: baseAnswers.goal });
      nextStep();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingStep(false);
    }
  };

  // Step 4: Generate adaptive questions
  useEffect(() => {
    if (currentStep === 4 && adaptiveQuestions.length === 0 && category && Object.keys(baseAnswers).length > 0) {
      generateAdaptiveQuestions().catch(err => {
        console.error('Failed to generate adaptive questions:', err);
        setError(err.message);
      });
    }
  }, [currentStep, adaptiveQuestions.length, category, baseAnswers]);

  const generateAdaptiveQuestions = async () => {
    try {
      setProcessingStep(true);
      setError(null);
      
      const result = await apiClient.generateAdaptiveQuestions(ideaDescription, category, baseAnswers);
      setAdaptiveQuestions(result.questions);
      
      await updateSessionData({ adaptiveQuestions: result.questions });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingStep(false);
    }
  };

  const handleAdaptiveAnswersSubmit = async () => {
    await updateSessionData({ adaptiveAnswers });
    nextStep();
  };

  // Step 5: Generate PRD
  useEffect(() => {
    if (currentStep === 5 && !prd && category && Object.keys(baseAnswers).length > 0) {
      generatePRD().catch(err => {
        console.error('Failed to generate PRD:', err);
        setError(err.message);
      });
    }
  }, [currentStep, prd, category, baseAnswers]);

  const generatePRD = async () => {
    try {
      setProcessingStep(true);
      setError(null);
      
      const allAnswers = { ...baseAnswers, ...adaptiveAnswers };
      
      const result = await apiClient.generatePRD(ideaDescription, category, allAnswers, projectGoal);
      setPrd(result.prd);
      
      await updateSessionData({ prd: result.prd });
      
      // Сразу генерируем промпты
      await generateAllPrompts(result.prd);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingStep(false);
    }
  };

  const generateAllPrompts = async (prdText) => {
    try {
      const result = await apiClient.generatePrompts(prdText, projectGoal, category);
      setPrompts(result.prompts);
      setPromptsOutdated(false);
      
      await updateSessionData({ prompts: result.prompts });
      
    } catch (err) {
      console.error('Failed to generate prompts:', err);
    }
  };

  const handlePRDEdit = (newPrd) => {
    setPrd(newPrd);
    setPromptsOutdated(true);
    updateSessionData({ prd: newPrd });
  };

  const handleRegeneratePrompts = async () => {
    await generateAllPrompts(prd);
  };

  // Step 9: Generate debug prompt
  const handleGenerateDebugPrompt = async () => {
    if (!errorDescription) {
      setError('Опишите ошибку');
      return;
    }

    try {
      setProcessingStep(true);
      setError(null);
      
      const result = await apiClient.generateDebugPrompt(errorDescription, prd);
      setDebugPrompt(result.debugPrompt);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingStep(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Загрузка..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showOnboarding && (
        <Onboarding 
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
        />
      )}

      {projectGoal && currentStep > 3 && (
        <GoalBadge goal={projectGoal} />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cursor AI Guide</h1>
              <p className="text-gray-600 mt-1">Создайте проект от идеи до деплоя</p>
            </div>
            
            <button
              onClick={handleStartOver}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Начать заново
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Шаг {currentStep} из 10</span>
              <span>{Math.round((currentStep / 10) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8">
            <ErrorMessage error={error} onRetry={() => setError(null)} />
          </div>
        )}

        {/* Steps content */}
        <div className="bg-white shadow-sm rounded-lg p-8">
          {currentStep === 1 && <Step1 onNext={nextStep} />}
          
          {currentStep === 2 && (
            <Step2
              ideaDescription={ideaDescription}
              setIdeaDescription={handleIdeaDescriptionChange}
              category={category}
              onSelectCategory={handleCategorySelect}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 3 && (
            <Step3
              questions={baseQuestions}
              answers={baseAnswers}
              setAnswers={setBaseAnswers}
              onSubmit={handleBaseAnswersSubmit}
              processing={processingStep}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 4 && (
            <Step4
              questions={adaptiveQuestions}
              answers={adaptiveAnswers}
              setAnswers={setAdaptiveAnswers}
              onSubmit={handleAdaptiveAnswersSubmit}
              processing={processingStep}
              onRetry={generateAdaptiveQuestions}
              error={error}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 5 && (
            <Step5
              prd={prd}
              onEdit={handlePRDEdit}
              promptsOutdated={promptsOutdated}
              onRegeneratePrompts={handleRegeneratePrompts}
              processing={processingStep}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 6 && (
            <Step6
              prompt={prompts.setup}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 7 && (
            <Step7
              prompt={prompts.planning}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 8 && (
            <Step8
              prompt={prompts.implementation}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {currentStep === 9 && (
            <Step9
              errorDescription={errorDescription}
              setErrorDescription={setErrorDescription}
              debugPrompt={debugPrompt}
              onGenerate={handleGenerateDebugPrompt}
              processing={processingStep}
              onBackToDeploy={() => goToStep(10)}
            />
          )}
          
          {currentStep === 10 && (
            <Step10
              prompts={prompts}
              goal={projectGoal}
              sessionId={session?.id}
              onPrev={prevStep}
              onGoToDebug={() => goToStep(9)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Welcome
function Step1({ onNext }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-6">👋</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Добро пожаловать!
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        Я помогу вам создать проект с помощью Cursor AI.<br />
        Пройдите простой опросник, и вы получите готовые промпты для AI-кодирования.
      </p>
      
      <button
        onClick={onNext}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700"
      >
        Начать →
      </button>
    </div>
  );
}

// Step 2: Idea + Category
function Step2({ ideaDescription, setIdeaDescription, category, onSelectCategory, onNext, onPrev }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Опишите вашу идею</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Что вы хотите создать? (3-5 предложений)
        </label>
        <textarea
          value={ideaDescription}
          onChange={(e) => setIdeaDescription(e.target.value)}
          placeholder="Например: Хочу создать приложение для учета личных финансов. Пользователь сможет добавлять доходы и расходы, видеть графики трат по категориям..."
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Категория продукта
        </label>
        <select
          value={category || ''}
          onChange={(e) => onSelectCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Выберите категорию --</option>
          <option value="WEB_APP">🌐 Web приложение</option>
          <option value="BOT">🤖 Telegram бот</option>
          <option value="MOBILE_APP">📱 Мобильное приложение</option>
        </select>
        {category && (
          <div className="mt-3">
            <CategoryBadge category={category} />
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
        
        <button
          onClick={onNext}
          disabled={!category || !ideaDescription || ideaDescription.trim().length < 20}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

// Step 3: Base questions
function Step3({ questions, answers, setAnswers, onSubmit, processing, onPrev }) {
  const goalOptions = [
    {
      value: 'Обучение и практика',
      description: 'Простой код, без тестов, локальный запуск'
    },
    {
      value: 'Использовать самому',
      description: 'Рабочий код, опциональные тесты'
    },
    {
      value: 'Для пользователей',
      description: 'Production-ready, тесты обязательны, облачный деплой'
    },
    {
      value: 'Портфолио',
      description: 'Идеальный код, полное покрытие тестами, красивый деплой'
    }
  ];

  // Если вопросы не загружены, показываем индикатор загрузки
  if (!questions || questions.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Базовые вопросы</h2>
        <LoadingSpinner text="Загрузка вопросов..." />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Базовые вопросы</h2>
      
      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="border-b border-gray-200 pb-6 last:border-0">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {q.question}
            </label>
            
            {q.explanation && (
              <p className="text-sm text-gray-600 mb-3">{q.explanation}</p>
            )}

            {q.type === 'select' ? (
              <div className="space-y-3">
                <select
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  required={q.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Выберите цель</option>
                  {goalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>

                {answers[q.id] && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      {goalOptions.find(o => o.value === answers[q.id])?.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder={q.placeholder}
                required={q.required}
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
        
        <button
          onClick={onSubmit}
          disabled={processing || Object.keys(answers).length < questions.length}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {processing ? 'Проверка...' : 'Далее →'}
        </button>
      </div>
    </div>
  );
}

// Step 4: Adaptive questions
function Step4({ questions, answers, setAnswers, onSubmit, processing, onRetry, error, onPrev }) {
  if (processing) {
    return <LoadingSpinner text="AI генерирует вопросы специально для вашей идеи..." />;
  }

  if (error && questions.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Дополнительные вопросы</h2>
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Дополнительные вопросы</h2>
      <p className="text-gray-600 mb-6">
        AI сгенерировал вопросы специально для вашего проекта:
      </p>
      
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {q.question}
            </label>
            
            {q.explanation && (
              <p className="text-sm text-gray-600 mb-3">{q.explanation}</p>
            )}

            {q.type === 'select' ? (
              <select
                value={answers[idx] || ''}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-- Выберите --</option>
                {q.options.map((opt, optIdx) => (
                  <option key={optIdx} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <textarea
                value={answers[idx] || ''}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                placeholder={q.placeholder}
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
        
        <button
          onClick={onSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

// Step 5: PRD
function Step5({ prd, onEdit, promptsOutdated, onRegeneratePrompts, processing, onNext, onPrev }) {
  if (processing) {
    return <LoadingSpinner text="AI пишет PRD..." />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Requirements Document</h2>
      <p className="text-gray-600 mb-6">
        AI создал детальный PRD для вашего проекта:
      </p>
      
      {promptsOutdated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            PRD изменен. Промпты могут быть неактуальны.
          </p>
          <button
            onClick={onRegeneratePrompts}
            className="mt-2 text-sm text-yellow-900 underline hover:text-yellow-700"
          >
            Пересгенерировать промпты
          </button>
        </div>
      )}

      <PromptCard
        prompt={prd}
        title="PRD"
        editable={true}
        onEdit={onEdit}
      />

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
        
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

// Step 6: Setup
function Step6({ prompt, onNext, onPrev }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup: Создание структуры и правил</h2>
      
      <InstructionBox>
        <h3>Как начать</h3>
        <ol>
          <li>Откройте Cursor в папке вашего проекта</li>
          <li>Скопируйте промпт ниже</li>
          <li>Вставьте в чат Cursor (Ctrl+L)</li>
          <li>Дождитесь создания структуры и правил</li>
        </ol>
      </InstructionBox>

      <div className="mt-6">
        <PromptCard
          prompt={prompt}
          title="Setup Prompt"
          showTokenCount={true}
        />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
        
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

// Step 7: Planning
function Step7({ prompt, onNext, onPrev }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Planning: Составление плана</h2>
      
      <InstructionBox>
        <h3>Включите режим планирования</h3>
        <ol>
          <li>В Cursor: Ctrl+Shift+P (Cmd+Shift+P на Mac)</li>
          <li>Найдите: "Plan: Open"</li>
          <li>Скопируйте промпт ниже в план</li>
        </ol>
        
        <details className="mt-4">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
            Что такое Plan в Cursor?
          </summary>
          <p className="mt-2 text-sm text-gray-600">
            Режим для больших задач с разбивкой на todos. Cursor создаст план и будет работать над ним до полного завершения всех задач.
          </p>
        </details>
      </InstructionBox>

      <div className="mt-6">
        <PromptCard prompt={prompt} title="Planning Prompt" showTokenCount={true} />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
        
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

// Step 8: Implementation
function Step8({ prompt, onNext, onPrev }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation: Реализация</h2>
      
      <InstructionBox>
        <h3>Советы по реализации</h3>
        <ul>
          <li>Используйте Composer для больших задач (Ctrl+Shift+P → "Composer: Open")</li>
          <li>Отмечайте todos по мере выполнения</li>
          <li>Cursor не остановится пока все todos не завершены</li>
        </ul>
      </InstructionBox>

      <div className="mt-6">
        <PromptCard prompt={prompt} title="Implementation Prompt" showTokenCount={true} />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
        
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Далее →
        </button>
      </div>
    </div>
  );
}

// Step 9: Debug
function Step9({ errorDescription, setErrorDescription, debugPrompt, onGenerate, processing, onBackToDeploy }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Debug: Исправление ошибок</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Опишите ошибку детально
        </label>
        <textarea
          value={errorDescription}
          onChange={(e) => setErrorDescription(e.target.value)}
          placeholder="Что делали, что ожидали, что получили..."
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={processing || !errorDescription}
        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed mb-6"
      >
        {processing ? 'Генерация...' : 'Сгенерировать debug промпт'}
      </button>

      {debugPrompt && (
        <div className="mb-6">
          <PromptCard prompt={debugPrompt} title="Debug Prompt" showTokenCount={true} />
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onBackToDeploy}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Вернуться к деплою
        </button>
      </div>
    </div>
  );
}

// Step 10: Deploy
function Step10({ prompts, goal, sessionId, onPrev, onGoToDebug }) {
  const [activeTab, setActiveTab] = useState('vercel');

  const deployTabs = [
    { id: 'vercel', label: 'Vercel', recommended: goal === 'Портфолио' || goal === 'Для пользователей' },
    { id: 'docker', label: 'Docker', recommended: goal === 'Использовать самому' },
    { id: 'local', label: 'Локально', recommended: goal === 'Обучение и практика' }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Deploy: Запуск в продакшн</h2>
      
      <div className="flex border-b border-gray-200 mb-6">
        {deployTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.recommended && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Рекомендуется
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'vercel' && (
        <div>
          <Checklist>
            <CheckItem>Node.js установлен</CheckItem>
            <CheckItem>Vercel CLI: npm i -g vercel</CheckItem>
            <CheckItem>Проект собирается: npm run build</CheckItem>
          </Checklist>

          <div className="mt-6">
            <CommandBox command="vercel --prod" />
          </div>

          <div className="mt-6">
            <PromptCard
              prompt={prompts.deployVercel}
              title="Автоматизация деплоя (опционально)"
            />
          </div>
        </div>
      )}

      {activeTab === 'docker' && (
        <div>
          <PromptCard prompt={prompts.deployDocker} />
        </div>
      )}

      {activeTab === 'local' && (
        <div>
          <PromptCard prompt={prompts.deployLocal} />
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={onGoToDebug}
          className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center"
        >
          <span className="mr-2">⚠️</span>
          Возникли ошибки?
        </button>
      </div>

      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Поздравляем!
        </h3>
        <p className="text-gray-600 mb-6">
          Вы создали проект с помощью Cursor AI!
        </p>
        
        <ExportButton sessionId={sessionId} />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Назад
        </button>
      </div>
    </div>
  );
}
