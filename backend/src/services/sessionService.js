const { v4: uuidv4 } = require('uuid');

/**
 * Session Service - управление пользовательскими сессиями
 * In-memory хранилище для MVP
 */
class SessionService {
  constructor() {
    // Map<sessionId, sessionData>
    this.sessions = new Map();
    
    // Очистка старых сессий (старше 24 часов)
    this.startCleanupInterval();
  }

  /**
   * Создать новую сессию
   */
  createSession() {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      currentStep: 1, // Step 1: Welcome
      ideaDescription: null,
      category: null,
      categoryConfidence: null,
      baseAnswers: {},
      adaptiveQuestions: [],
      adaptiveAnswers: {},
      prd: null,
      prompts: {},
      projectGoal: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);
    console.log(`✅ Создана новая сессия: ${sessionId}`);
    
    return session;
  }

  /**
   * Получить сессию по ID
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.warn(`⚠️  Сессия не найдена: ${sessionId}`);
      return null;
    }

    return session;
  }

  /**
   * Обновить сессию
   */
  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Сессия не найдена: ${sessionId}`);
    }

    // Обновляем поля
    Object.assign(session, updates, {
      updatedAt: new Date()
    });

    this.sessions.set(sessionId, session);
    console.log(`📝 Обновлена сессия: ${sessionId}`);
    
    return session;
  }

  /**
   * Сбросить сессию (начать заново)
   */
  resetSession(sessionId) {
    const oldSession = this.sessions.get(sessionId);
    
    if (!oldSession) {
      throw new Error(`Сессия не найдена: ${sessionId}`);
    }

    // Создаем новую сессию с тем же ID
    const session = {
      id: sessionId,
      currentStep: 1,
      ideaDescription: null,
      category: null,
      categoryConfidence: null,
      baseAnswers: {},
      adaptiveQuestions: [],
      adaptiveAnswers: {},
      prd: null,
      prompts: {},
      projectGoal: null,
      createdAt: oldSession.createdAt, // сохраняем дату создания
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);
    console.log(`🔄 Сброшена сессия: ${sessionId}`);
    
    return session;
  }

  /**
   * Удалить сессию
   */
  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    
    if (deleted) {
      console.log(`🗑️  Удалена сессия: ${sessionId}`);
    }
    
    return deleted;
  }

  /**
   * Получить все сессии (для отладки)
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Получить статистику
   */
  getStats() {
    const sessions = Array.from(this.sessions.values());
    
    return {
      total: sessions.length,
      byStep: sessions.reduce((acc, s) => {
        acc[s.currentStep] = (acc[s.currentStep] || 0) + 1;
        return acc;
      }, {}),
      byCategory: sessions.reduce((acc, s) => {
        if (s.category) {
          acc[s.category] = (acc[s.category] || 0) + 1;
        }
        return acc;
      }, {}),
      byGoal: sessions.reduce((acc, s) => {
        if (s.projectGoal) {
          acc[s.projectGoal] = (acc[s.projectGoal] || 0) + 1;
        }
        return acc;
      }, {})
    };
  }

  /**
   * Очистка старых сессий (запускается автоматически)
   */
  startCleanupInterval() {
    // Каждый час проверяем и удаляем старые сессии
    setInterval(() => {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 часа
      let deleted = 0;

      for (const [sessionId, session] of this.sessions.entries()) {
        const age = now - session.createdAt;
        if (age > maxAge) {
          this.sessions.delete(sessionId);
          deleted++;
        }
      }

      if (deleted > 0) {
        console.log(`🧹 Очищено старых сессий: ${deleted}`);
      }
    }, 60 * 60 * 1000); // каждый час
  }
}

// Singleton instance
const sessionService = new SessionService();

module.exports = sessionService;

