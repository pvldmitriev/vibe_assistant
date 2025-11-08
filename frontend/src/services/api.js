import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Логирование запросов для отладки
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * API методы
 */
export const apiClient = {
  /**
   * Анализ идеи пользователя
   */
  analyzeIdea: async (idea) => {
    const response = await api.post('/api/analyze-idea', { idea });
    return response.data;
  },

  /**
   * Обновление образа продукта
   */
  updateProductVision: async (projectId, corrections) => {
    const response = await api.put(`/api/analyze-idea/${projectId}`, { corrections });
    return response.data;
  },

  /**
   * Генерация плана разработки
   */
  generatePlan: async (projectId) => {
    const response = await api.post('/api/generate-plan', { projectId });
    return response.data;
  },

  /**
   * Получение плана проекта
   */
  getPlan: async (projectId) => {
    const response = await api.get(`/api/generate-plan/${projectId}`);
    return response.data;
  },

  /**
   * Получение шагов проекта
   */
  getSteps: async (projectId) => {
    const response = await api.get(`/api/steps/${projectId}`);
    return response.data;
  },

  /**
   * Получение конкретного шага
   */
  getStep: async (stepId) => {
    const response = await api.get(`/api/steps/step/${stepId}`);
    return response.data;
  },

  /**
   * Отметить шаг как выполненный
   */
  completeStep: async (stepId) => {
    const response = await api.post(`/api/steps/${stepId}/complete`);
    return response.data;
  },

  /**
   * Отменить выполнение шага
   */
  uncompleteStep: async (stepId) => {
    const response = await api.post(`/api/steps/${stepId}/uncomplete`);
    return response.data;
  },
};

export default api;

