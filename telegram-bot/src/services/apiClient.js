const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 секунд для AI запросов
});

// Логирование запросов
api.interceptors.request.use((config) => {
  console.log(`📡 API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

module.exports = {
  /**
   * Анализ идеи
   */
  async analyzeIdea(idea) {
    const response = await api.post('/api/analyze-idea', { idea });
    return response.data;
  },

  /**
   * Обновление образа продукта
   */
  async updateProductVision(projectId, corrections) {
    const response = await api.put(`/api/analyze-idea/${projectId}`, { corrections });
    return response.data;
  },

  /**
   * Генерация плана
   */
  async generatePlan(projectId) {
    const response = await api.post('/api/generate-plan', { projectId });
    return response.data;
  },

  /**
   * Получение плана проекта
   */
  async getPlan(projectId) {
    const response = await api.get(`/api/generate-plan/${projectId}`);
    return response.data;
  },

  /**
   * Получение шагов
   */
  async getSteps(projectId) {
    const response = await api.get(`/api/steps/${projectId}`);
    return response.data;
  },

  /**
   * Получение конкретного шага
   */
  async getStep(stepId) {
    const response = await api.get(`/api/steps/step/${stepId}`);
    return response.data;
  },

  /**
   * Отметить шаг как выполненный
   */
  async completeStep(stepId) {
    const response = await api.post(`/api/steps/${stepId}/complete`);
    return response.data;
  },

  /**
   * Отменить выполнение шага
   */
  async uncompleteStep(stepId) {
    const response = await api.post(`/api/steps/${stepId}/uncomplete`);
    return response.data;
  },
};

