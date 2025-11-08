/**
 * API Client с обработкой ошибок
 */

class APIClient {
  constructor() {
    // baseURL будет определяться динамически в request()
  }

  /**
   * Получить базовый URL для API
   * В браузере используем полный URL к backend (проксируется через порт Docker)
   * На сервере (SSR) используем полный URL из env
   */
  getBaseURL() {
    // Проверяем что мы в браузере
    if (typeof window !== 'undefined') {
      // Client-side: используем полный URL к backend
      // В Docker это будет http://localhost:3001 (проксируется через порт)
      // В локальной разработке тоже localhost:3001
      return 'http://localhost:3001/api';
    }
    
    // Server-side (SSR): используем полный URL для внутренних запросов в Docker
    const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Убеждаемся что URL заканчивается на /api
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  /**
   * Базовый метод для API запросов
   */
  async request(endpoint, options = {}) {
    const baseURL = this.getBaseURL();
    const url = `${baseURL}${endpoint}`;
    
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Если не OK, пытаемся распарсить ошибку
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: 'Ошибка сервера'
        }));
        
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Если ответ пустой (например 204)
      if (response.status === 204) {
        return null;
      }

      return await response.json();

    } catch (error) {
      // Обработка сетевых ошибок
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Нет связи с сервером. Проверьте интернет-соединение.');
      }

      // Пробрасываем ошибку дальше
      throw error;
    }
  }

  // ========== Session API ==========

  async createSession() {
    return this.request('/sessions', {
      method: 'POST',
    });
  }

  async getSession(sessionId) {
    return this.request(`/sessions/${sessionId}`);
  }

  async updateSession(sessionId, data) {
    return this.request(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: data,
    });
  }

  async resetSession(sessionId) {
    return this.request(`/sessions/${sessionId}/reset`, {
      method: 'POST',
    });
  }

  // ========== Questions API ==========

  async getBaseQuestions() {
    return this.request('/questions/base');
  }

  async validateAnswers(answers) {
    return this.request('/questions/validate', {
      method: 'POST',
      body: { answers },
    });
  }

  // ========== AI API ==========

  async analyzeCategory(ideaDescription) {
    return this.request('/analyze-category', {
      method: 'POST',
      body: { ideaDescription },
    });
  }

  async generateAdaptiveQuestions(ideaDescription, category, baseAnswers) {
    return this.request('/generate-adaptive-questions', {
      method: 'POST',
      body: { ideaDescription, category, baseAnswers },
    });
  }

  async generatePRD(ideaDescription, category, allAnswers, goal) {
    return this.request('/generate-prd', {
      method: 'POST',
      body: { ideaDescription, category, allAnswers, goal },
    });
  }

  async generatePrompts(prd, goal, category) {
    return this.request('/generate-prompts', {
      method: 'POST',
      body: { prd, goal, category },
    });
  }

  async generateDebugPrompt(errorDescription, prd) {
    return this.request('/generate-debug-prompt', {
      method: 'POST',
      body: { errorDescription, prd },
    });
  }

  // ========== Export API ==========

  async exportSession(sessionId) {
    // Экспорт возвращает ZIP файл
    const url = `${this.baseURL}/export/${sessionId}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Не удалось экспортировать данные');
      }

      const blob = await response.blob();
      return blob;

    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Нет связи с сервером. Проверьте интернет-соединение.');
      }
      throw error;
    }
  }

  // ========== Stats API (для отладки) ==========

  async getStats() {
    return this.request('/stats');
  }
}

// Singleton instance
const apiClient = new APIClient();

export default apiClient;

