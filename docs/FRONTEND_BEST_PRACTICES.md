# Лучшие практики для доработки фронтенда — React + Vite

**Дата:** Ноябрь 2025  
**Источник:** Исследование актуальных практик и рекомендаций  
**Статус:** Руководство по улучшению кода

---

## 📚 Содержание

1. [TypeScript конфигурация](#1-typescript-конфигурация)
2. [Интеграция с API](#2-интеграция-с-api)
3. [Обработка ошибок](#3-обработка-ошибок)
4. [TanStack Query (React Query)](#4-tanstack-query-react-query)
5. [Валидация данных с Zod](#5-валидация-данных-с-zod)
6. [Управление состоянием и роутинг](#6-управление-состоянием-и-роутинг)
7. [Производительность и оптимизация](#7-производительность-и-оптимизация)
8. [Структура проекта](#8-структура-проекта)
9. [Тестирование](#9-тестирование)
10. [Безопасность](#10-безопасность)

---

## 1. TypeScript конфигурация

### 1.1 Строгий режим TypeScript

**Проблема:** В текущем проекте отключены все строгие проверки TypeScript.

**Лучшие практики (2025):**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,                    // ✅ Включает все строгие проверки
    "noImplicitAny": true,             // ✅ Запрещает неявные any
    "strictNullChecks": true,          // ✅ Строгая проверка null/undefined
    "strictFunctionTypes": true,        // ✅ Строгая проверка типов функций
    "strictBindCallApply": true,        // ✅ Строгая проверка bind/call/apply
    "strictPropertyInitialization": true, // ✅ Проверка инициализации свойств
    "noUnusedLocals": true,            // ✅ Предупреждения о неиспользуемых переменных
    "noUnusedParameters": true,        // ✅ Предупреждения о неиспользуемых параметрах
    "noImplicitReturns": true,         // ✅ Все пути функции должны возвращать значение
    "noFallthroughCasesInSwitch": true, // ✅ Предупреждения о fallthrough в switch
    "noUncheckedIndexedAccess": true,  // ✅ Строгая проверка индексов массивов
    "exactOptionalPropertyTypes": true  // ✅ Точная проверка optional свойств
  }
}
```

**Рекомендации:**
- Включать `strict: true` постепенно, исправляя ошибки по мере их появления
- Использовать `@ts-expect-error` или `@ts-ignore` только в крайних случаях с комментариями
- Настроить ESLint правила для TypeScript: `@typescript-eslint/strict`

### 1.2 Типизация компонентов

**Лучшие практики:**

```typescript
// ✅ Хорошо: Явная типизация пропсов
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled, variant = 'primary' }) => {
  // ...
};

// ✅ Хорошо: Использование React.ComponentProps для расширения
interface CustomInputProps extends React.ComponentProps<'input'> {
  label: string;
  error?: string;
}

// ❌ Плохо: Использование any
const handleData = (data: any) => { // ❌
  // ...
};

// ✅ Хорошо: Строгая типизация
interface ApiResponse {
  id: string;
  name: string;
  createdAt: string;
}

const handleData = (data: ApiResponse) => { // ✅
  // ...
};
```

---

## 2. Интеграция с API

### 2.1 Создание API клиента

**Лучшие практики (2025):**

```typescript
// src/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Типы для API
interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Базовый API клиент
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Экспорт экземпляра
export const apiClient = new ApiClient(API_BASE_URL);

// Типизированные методы API
export const api = {
  analyzeIdea: (idea: string) =>
    apiClient.post<{ vision: string }>('/api/analyze-idea', { idea }),

  generatePlan: (vision: string) =>
    apiClient.post<{ steps: Step[] }>('/api/generate-plan', { vision }),

  getSteps: (projectId: string) =>
    apiClient.get<{ steps: Step[] }>(`/api/steps/${projectId}`),

  completeStep: (stepId: string) =>
    apiClient.post(`/api/steps/${stepId}/complete`, {}),
};
```

### 2.2 Обработка ошибок в компонентах

**Лучшие практики:**

```typescript
// src/pages/Index.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';

const Index = () => {
  const analyzeMutation = useMutation({
    mutationFn: api.analyzeIdea,
    onSuccess: (data) => {
      navigate('/analysis', { state: { vision: data.vision } });
    },
    onError: (error: ApiError) => {
      // Специфичная обработка ошибок
      if (error.status === 429) {
        toast.error('Слишком много запросов. Попробуйте позже.');
      } else if (error.status === 500) {
        toast.error('Ошибка сервера. Попробуйте позже.');
      } else {
        toast.error(error.message || 'Произошла ошибка при анализе идеи');
      }
    },
  });

  const handleIdeaSubmit = async (idea: string) => {
    analyzeMutation.mutate(idea);
  };

  return (
    // ...
  );
};
```

### 2.3 Retry логика и таймауты

**Лучшие практики:**

```typescript
// Добавить в ApiClient
private async request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  try {
    // ... существующий код
  } catch (error) {
    if (retries > 0 && error.status >= 500) {
      // Retry для серверных ошибок
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.request<T>(endpoint, options, retries - 1);
    }
    throw error;
  }
}

// Добавить таймаут
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw error;
  }
};
```

---

## 3. Обработка ошибок

### 3.1 Error Boundary

**Лучшие практики (2025):**

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логирование ошибки в сервис мониторинга
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Отправка в сервис мониторинга (например, Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Что-то пошло не так</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'Произошла непредвиденная ошибка'}
          </p>
          <Button onClick={this.handleReset}>
            Попробовать снова
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Использование в App.tsx
<ErrorBoundary>
  <Routes>
    {/* ... */}
  </Routes>
</ErrorBoundary>
```

### 3.2 Обработка ошибок в async функциях

**Лучшие практики:**

```typescript
// ✅ Хорошо: Полная обработка ошибок
const handleAsyncOperation = async () => {
  try {
    setIsLoading(true);
    const data = await api.analyzeIdea(idea);
    // Обработка успеха
    onSuccess(data);
  } catch (error) {
    // Специфичная обработка
    if (error instanceof ApiError) {
      handleApiError(error);
    } else if (error instanceof NetworkError) {
      handleNetworkError(error);
    } else {
      handleUnknownError(error);
    }
  } finally {
    setIsLoading(false);
  }
};

// ✅ Хорошо: Утилита для безопасного выполнения
const safeAsync = async <T,>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    onError?.(error);
    return null;
  }
};

// Использование
const result = await safeAsync(
  () => api.analyzeIdea(idea),
  (error) => toast.error('Ошибка при анализе')
);
```

---

## 4. TanStack Query (React Query)

### 4.1 Настройка QueryClient

**Лучшие практики (2025):**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,      // Не обновлять при фокусе окна
      refetchOnMount: true,             // Обновлять при монтировании
      refetchOnReconnect: true,         // Обновлять при переподключении
      retry: 1,                         // Количество повторов
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,        // 5 минут - данные считаются свежими
      gcTime: 10 * 60 * 1000,           // 10 минут - время хранения в кеше (было cacheTime)
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        // Глобальная обработка ошибок мутаций
        console.error('Mutation error:', error);
      },
    },
  },
});
```

### 4.2 Использование useQuery и useMutation

**Лучшие практики:**

```typescript
// src/hooks/useIdeaAnalysis.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

// Query для получения данных
export const useSteps = (projectId: string | null) => {
  return useQuery({
    queryKey: ['steps', projectId],
    queryFn: () => api.getSteps(projectId!),
    enabled: !!projectId, // Запрос выполняется только если projectId существует
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
};

// Mutation для изменения данных
export const useAnalyzeIdea = () => {
  return useMutation({
    mutationFn: api.analyzeIdea,
    onSuccess: (data) => {
      // Инвалидация связанных запросов
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
    },
  });
};

// Комбинированный хук
export const useIdeaWorkflow = () => {
  const analyzeMutation = useAnalyzeIdea();
  const planMutation = useMutation({
    mutationFn: api.generatePlan,
  });

  return {
    analyze: analyzeMutation.mutate,
    generatePlan: planMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    isGeneratingPlan: planMutation.isPending,
  };
};
```

### 4.3 Оптимистичные обновления

**Лучшие практики:**

```typescript
// Оптимистичное обновление для завершения шага
const completeStepMutation = useMutation({
  mutationFn: api.completeStep,
  onMutate: async (stepId) => {
    // Отменяем текущие запросы
    await queryClient.cancelQueries({ queryKey: ['steps'] });

    // Сохраняем предыдущее значение
    const previousSteps = queryClient.getQueryData(['steps']);

    // Оптимистично обновляем
    queryClient.setQueryData(['steps'], (old: Step[]) =>
      old.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );

    return { previousSteps };
  },
  onError: (err, stepId, context) => {
    // Откатываем изменения при ошибке
    queryClient.setQueryData(['steps'], context?.previousSteps);
  },
  onSettled: () => {
    // Обновляем данные после завершения
    queryClient.invalidateQueries({ queryKey: ['steps'] });
  },
});
```

---

## 5. Валидация данных с Zod

### 5.1 Создание схем валидации

**Лучшие практики (2025):**

```typescript
// src/types/schemas.ts
import { z } from 'zod';

// Схема для идеи
export const ideaSchema = z.object({
  idea: z
    .string()
    .min(10, 'Идея должна содержать минимум 10 символов')
    .max(1000, 'Идея не должна превышать 1000 символов')
    .trim(),
});

export type IdeaInput = z.infer<typeof ideaSchema>;

// Схема для шага
export const stepSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1, 'Название шага обязательно'),
  prompt: z.string().min(1, 'Промпт обязателен'),
  dod: z.array(z.string().min(1)).min(1, 'Должен быть хотя бы один критерий'),
});

export type Step = z.infer<typeof stepSchema>;

// Схема для ответа API
export const analysisResponseSchema = z.object({
  vision: z.string().min(1),
  idea: z.string().optional(),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

// Схема для плана
export const planResponseSchema = z.object({
  steps: z.array(stepSchema),
});

export type PlanResponse = z.infer<typeof planResponseSchema>;
```

### 5.2 Интеграция с react-hook-form

**Лучшие практики:**

```typescript
// src/components/IdeaForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ideaSchema, type IdeaInput } from '@/types/schemas';

export const IdeaForm = ({ onSubmit, isLoading }: IdeaFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<IdeaInput>({
    resolver: zodResolver(ideaSchema),
    mode: 'onChange', // Валидация при изменении
  });

  const onFormSubmit = (data: IdeaInput) => {
    onSubmit(data.idea);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Textarea
        {...register('idea')}
        error={errors.idea?.message}
        disabled={isLoading}
      />
      {errors.idea && (
        <p className="text-sm text-destructive mt-1">
          {errors.idea.message}
        </p>
      )}
      <Button type="submit" disabled={!isValid || isLoading}>
        Анализировать идею
      </Button>
    </form>
  );
};
```

### 5.3 Валидация ответов API

**Лучшие практики:**

```typescript
// src/services/api.ts
import { analysisResponseSchema, planResponseSchema } from '@/types/schemas';

// Безопасный парсинг ответа API
const safeParseResponse = <T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ApiError(
      `Invalid API response: ${result.error.message}`,
      500,
      'VALIDATION_ERROR'
    );
  }
  
  return result.data;
};

// Использование
export const api = {
  analyzeIdea: async (idea: string) => {
    const response = await apiClient.post('/api/analyze-idea', { idea });
    return safeParseResponse(analysisResponseSchema, response);
  },
  
  generatePlan: async (vision: string) => {
    const response = await apiClient.post('/api/generate-plan', { vision });
    return safeParseResponse(planResponseSchema, response);
  },
};
```

---

## 6. Управление состоянием и роутинг

### 6.1 Персистентность данных

**Лучшие практики:**

**Проблема:** Использование `location.state` теряет данные при перезагрузке страницы.

**Решение 1: localStorage + Context**

```typescript
// src/contexts/ProjectContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { Step, AnalysisResponse } from '@/types/schemas';

interface ProjectContextType {
  currentProject: {
    vision: string;
    steps: Step[];
    idea: string;
  } | null;
  setCurrentProject: (project: ProjectContextType['currentProject']) => void;
  clearProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'vibe-assistant-project';

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentProject, setCurrentProjectState] = useState<ProjectContextType['currentProject']>(null);

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCurrentProjectState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Сохранение в localStorage при изменении
  const setCurrentProject = (project: ProjectContextType['currentProject']) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearProject = () => {
    setCurrentProject(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, clearProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
```

**Решение 2: TanStack Query с персистентностью**

```typescript
// src/lib/queryClient.ts
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 часа
});
```

### 6.2 React Router best practices

**Лучшие практики:**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Защищенные маршруты
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentProject } = useProject();
  
  if (!currentProject) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Использование
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/analysis" element={<Analysis />} />
  <Route
    path="/plan"
    element={
      <ProtectedRoute>
        <Plan />
      </ProtectedRoute>
    }
  />
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## 7. Производительность и оптимизация

### 7.1 Lazy Loading и Code Splitting

**Лучшие практики (2025):**

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy loading страниц
const Index = lazy(() => import('./pages/Index'));
const Analysis = lazy(() => import('./pages/Analysis'));
const Plan = lazy(() => import('./pages/Plan'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Fallback компонент
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner />
  </div>
);

// Использование
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/analysis" element={<Analysis />} />
    <Route path="/plan" element={<Plan />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</Suspense>
```

### 7.2 Мемоизация компонентов

**Лучшие практики:**

```typescript
// ✅ Мемоизация компонентов
export const IdeaForm = React.memo<IdeaFormProps>(({ onSubmit, isLoading }) => {
  // ...
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения (опционально)
  return prevProps.isLoading === nextProps.isLoading;
});

// ✅ Мемоизация функций
const handleSubmit = useCallback((idea: string) => {
  onSubmit(idea);
}, [onSubmit]);

// ✅ Мемоизация вычислений
const filteredSteps = useMemo(() => {
  return steps.filter(step => step.completed);
}, [steps]);
```

### 7.3 Оптимизация изображений

**Лучшие практики:**

```typescript
// Компонент для оптимизированных изображений
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const OptimizedImage = ({ src, alt, className }: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={className}>
      {isLoading && <Skeleton className="w-full h-full" />}
      {error && <div>Ошибка загрузки изображения</div>}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        style={{ display: isLoading || error ? 'none' : 'block' }}
      />
    </div>
  );
};
```

---

## 8. Структура проекта

### 8.1 Рекомендуемая структура (2025)

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── ui/             # UI библиотека (shadcn-ui)
│   └── features/       # Компоненты для конкретных фич
├── pages/              # Страницы приложения
├── hooks/              # Кастомные хуки
│   ├── useIdeaAnalysis.ts
│   └── useProject.ts
├── services/           # API клиенты и сервисы
│   ├── api.ts
│   └── storage.ts
├── contexts/           # React Context
│   └── ProjectContext.tsx
├── types/              # TypeScript типы и схемы
│   ├── index.ts
│   └── schemas.ts
├── lib/                # Утилиты
│   ├── utils.ts
│   └── queryClient.ts
├── config/             # Конфигурация
│   └── constants.ts
└── App.tsx
```

### 8.2 Feature-Sliced Design (опционально)

Для больших проектов рекомендуется использовать FSD:

```
src/
├── app/                # Инициализация приложения
├── pages/              # Страницы
├── widgets/            # Крупные блоки UI
├── features/           # Бизнес-логика
├── entities/           # Бизнес-сущности
└── shared/             # Переиспользуемый код
```

---

## 9. Тестирование

### 9.1 Настройка Vitest

**Лучшие практики (2025):**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 9.2 Тестирование компонентов

**Лучшие практики:**

```typescript
// src/components/__tests__/IdeaForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IdeaForm } from '../IdeaForm';

describe('IdeaForm', () => {
  it('отображает форму и позволяет ввести идею', () => {
    const onSubmit = vi.fn();
    render(<IdeaForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/опишите вашу идею/i);
    const button = screen.getByRole('button', { name: /анализировать/i });

    fireEvent.change(textarea, { target: { value: 'Моя идея' } });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith('Моя идея');
  });

  it('валидирует минимальную длину идеи', async () => {
    const onSubmit = vi.fn();
    render(<IdeaForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/опишите вашу идею/i);
    fireEvent.change(textarea, { target: { value: 'Коротко' } });

    await waitFor(() => {
      expect(screen.getByText(/минимум 10 символов/i)).toBeInTheDocument();
    });
  });
});
```

### 9.3 Тестирование хуков

**Лучшие практики:**

```typescript
// src/hooks/__tests__/useIdeaAnalysis.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalyzeIdea } from '../useIdeaAnalysis';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAnalyzeIdea', () => {
  it('успешно анализирует идею', async () => {
    const { result } = renderHook(() => useAnalyzeIdea(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('Моя идея');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

---

## 10. Безопасность

### 10.1 Санитизация пользовательского ввода

**Лучшие практики:**

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
};

// Использование
const safeVision = sanitizeHtml(vision);
```

### 10.2 Защита от XSS

**Лучшие практики:**

```typescript
// ✅ Хорошо: Использование dangerouslySetInnerHTML с санитизацией
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />

// ❌ Плохо: Прямое использование без санитизации
<div dangerouslySetInnerHTML={{ __html: content }} />

// ✅ Лучше: Избегать dangerouslySetInnerHTML
<div>{content}</div> // React автоматически экранирует
```

### 10.3 Content Security Policy

**Лучшие практики:**

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
/>
```

---

## 📋 Чек-лист внедрения

### Приоритет 1 (Критично)
- [ ] Включить TypeScript strict mode
- [ ] Создать API клиент с обработкой ошибок
- [ ] Добавить Error Boundary
- [ ] Настроить TanStack Query
- [ ] Добавить валидацию с Zod

### Приоритет 2 (Важно)
- [ ] Реализовать персистентность данных
- [ ] Добавить lazy loading
- [ ] Оптимизировать компоненты (memo, useMemo, useCallback)
- [ ] Настроить тестирование

### Приоритет 3 (Желательно)
- [ ] Добавить санитизацию
- [ ] Настроить мониторинг ошибок
- [ ] Оптимизировать изображения
- [ ] Добавить документацию компонентов

---

## 📚 Дополнительные ресурсы

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)
- [React Router v6 Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)

---

**Последнее обновление:** Ноябрь 2025

