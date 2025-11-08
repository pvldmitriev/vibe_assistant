const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const sessionService = require('../services/sessionService');
const questionService = require('../services/questionService');
const aiService = require('../services/aiService');

/**
 * Обработка ошибок с пользовательскими сообщениями
 */
function handleError(res, error, defaultMessage = 'Произошла ошибка') {
  console.error('API Error:', error);
  
  const message = error.message || defaultMessage;
  
  res.status(500).json({
    error: message,
    userFriendly: true
  });
}

/**
 * POST /api/sessions - Создать новую сессию
 */
router.post('/sessions', async (req, res) => {
  try {
    const session = sessionService.createSession();
    res.json(session);
  } catch (error) {
    handleError(res, error, 'Не удалось создать сессию');
  }
});

/**
 * GET /api/sessions/:id - Получить сессию
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = sessionService.getSession(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        error: 'Сессия не найдена',
        userFriendly: true
      });
    }
    
    res.json(session);
  } catch (error) {
    handleError(res, error, 'Не удалось получить сессию');
  }
});

/**
 * PUT /api/sessions/:id - Обновить сессию
 */
router.put('/sessions/:id', async (req, res) => {
  try {
    const session = sessionService.updateSession(req.params.id, req.body);
    res.json(session);
  } catch (error) {
    handleError(res, error, 'Не удалось обновить сессию');
  }
});

/**
 * POST /api/sessions/:id/reset - Сбросить сессию (начать заново)
 */
router.post('/sessions/:id/reset', async (req, res) => {
  try {
    const session = sessionService.resetSession(req.params.id);
    res.json(session);
  } catch (error) {
    handleError(res, error, 'Не удалось сбросить сессию');
  }
});

/**
 * DELETE /api/sessions/:id - Удалить сессию
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    const deleted = sessionService.deleteSession(req.params.id);
    res.json({ deleted });
  } catch (error) {
    handleError(res, error, 'Не удалось удалить сессию');
  }
});

/**
 * GET /api/questions/base - Получить базовые вопросы
 */
router.get('/questions/base', async (req, res) => {
  try {
    const questions = questionService.getBaseQuestions();
    res.json(questions);
  } catch (error) {
    handleError(res, error, 'Не удалось получить базовые вопросы');
  }
});

/**
 * POST /api/questions/validate - Валидация базовых ответов
 */
router.post('/questions/validate', async (req, res) => {
  try {
    const { answers } = req.body;
    
    if (!answers) {
      return res.status(400).json({
        error: 'Не переданы ответы для валидации',
        userFriendly: true
      });
    }
    
    const validation = questionService.validateBaseAnswers(answers);
    res.json(validation);
  } catch (error) {
    handleError(res, error, 'Ошибка валидации ответов');
  }
});

/**
 * POST /api/analyze-category - Определить категорию продукта
 */
router.post('/analyze-category', async (req, res) => {
  try {
    const { ideaDescription } = req.body;
    
    if (!ideaDescription) {
      return res.status(400).json({
        error: 'Не передано описание идеи',
        userFriendly: true
      });
    }
    
    const result = await aiService.analyzeIdeaCategory(ideaDescription);
    
    // Если confidence < 0.7, result будет null
    res.json(result || { category: null, confidence: 0, requiresManualSelection: true });
  } catch (error) {
    handleError(res, error, 'Не удалось определить категорию');
  }
});

/**
 * POST /api/generate-adaptive-questions - Сгенерировать адаптивные вопросы
 */
router.post('/generate-adaptive-questions', async (req, res) => {
  try {
    const { ideaDescription, category, baseAnswers } = req.body;
    
    if (!ideaDescription || !category || !baseAnswers) {
      return res.status(400).json({
        error: 'Не переданы все необходимые параметры',
        userFriendly: true
      });
    }
    
    const questions = await aiService.generateAdaptiveQuestions(
      ideaDescription,
      category,
      baseAnswers
    );
    
    res.json({ questions });
  } catch (error) {
    handleError(res, error, 'Не удалось сгенерировать вопросы');
  }
});

/**
 * POST /api/generate-prd - Сгенерировать PRD
 */
router.post('/generate-prd', async (req, res) => {
  try {
    const { ideaDescription, category, allAnswers, goal } = req.body;
    
    if (!ideaDescription || !category || !allAnswers || !goal) {
      return res.status(400).json({
        error: 'Не переданы все необходимые параметры',
        userFriendly: true
      });
    }
    
    const prd = await aiService.generatePRD(
      ideaDescription,
      category,
      allAnswers,
      goal
    );
    
    res.json({ prd });
  } catch (error) {
    handleError(res, error, 'Не удалось сгенерировать PRD');
  }
});

/**
 * POST /api/generate-prompts - Сгенерировать все промпты
 */
router.post('/generate-prompts', async (req, res) => {
  try {
    const { prd, goal, category } = req.body;
    
    if (!prd || !goal || !category) {
      return res.status(400).json({
        error: 'Не переданы все необходимые параметры',
        userFriendly: true
      });
    }
    
    const prompts = await aiService.generatePrompts(prd, goal, category);
    
    res.json({ prompts });
  } catch (error) {
    handleError(res, error, 'Не удалось сгенерировать промпты');
  }
});

/**
 * POST /api/generate-debug-prompt - Сгенерировать debug промпт
 */
router.post('/generate-debug-prompt', async (req, res) => {
  try {
    const { errorDescription, prd } = req.body;
    
    if (!errorDescription) {
      return res.status(400).json({
        error: 'Не передано описание ошибки',
        userFriendly: true
      });
    }
    
    const debugPrompt = await aiService.generateDebugPrompt(errorDescription, prd || '');
    
    res.json({ debugPrompt });
  } catch (error) {
    handleError(res, error, 'Не удалось сгенерировать debug промпт');
  }
});

/**
 * GET /api/export/:id - Экспорт всех данных сессии в ZIP
 */
router.get('/export/:id', async (req, res) => {
  try {
    const session = sessionService.getSession(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        error: 'Сессия не найдена',
        userFriendly: true
      });
    }

    // Создаем ZIP архив
    const archive = archiver('zip', {
      zlib: { level: 9 } // максимальное сжатие
    });

    // Устанавливаем заголовки ответа
    res.attachment(`cursor-guide-${session.id}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    // Pipe архив в response
    archive.pipe(res);

    // Добавляем PRD
    if (session.prd) {
      archive.append(session.prd, { name: 'PRD.md' });
    }

    // Добавляем промпты
    if (session.prompts) {
      if (session.prompts.setup) {
        archive.append(session.prompts.setup, { name: 'setup-prompt.txt' });
      }
      if (session.prompts.planning) {
        archive.append(session.prompts.planning, { name: 'planning-prompt.txt' });
      }
      if (session.prompts.implementation) {
        archive.append(session.prompts.implementation, { name: 'implementation-prompt.txt' });
      }
      if (session.prompts.debugPrompt) {
        archive.append(session.prompts.debugPrompt, { name: 'debug-prompt.txt' });
      }
    }

    // Добавляем инструкции по деплою
    if (session.prompts) {
      const deployInstructions = [];
      
      if (session.prompts.deployVercel) {
        deployInstructions.push('# Vercel\n\n' + session.prompts.deployVercel);
      }
      if (session.prompts.deployDocker) {
        deployInstructions.push('# Docker\n\n' + session.prompts.deployDocker);
      }
      if (session.prompts.deployLocal) {
        deployInstructions.push('# Local\n\n' + session.prompts.deployLocal);
      }

      if (deployInstructions.length > 0) {
        archive.append(deployInstructions.join('\n\n---\n\n'), { name: 'deploy-instructions.txt' });
      }
    }

    // Добавляем метаданные
    const metadata = {
      sessionId: session.id,
      createdAt: session.createdAt,
      category: session.category,
      categoryName: questionService.getCategoryName(session.category),
      goal: session.projectGoal,
      ideaDescription: session.ideaDescription,
      exportedAt: new Date().toISOString()
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    // Завершаем архив
    await archive.finalize();

    console.log(`✅ Экспорт сессии ${session.id} завершен`);

  } catch (error) {
    console.error('Ошибка экспорта:', error);
    
    // Если уже начали отправлять данные, просто завершаем
    if (res.headersSent) {
      return res.end();
    }
    
    handleError(res, error, 'Не удалось экспортировать данные');
  }
});

/**
 * GET /api/stats - Статистика по сессиям (для отладки)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = sessionService.getStats();
    res.json(stats);
  } catch (error) {
    handleError(res, error, 'Не удалось получить статистику');
  }
});

module.exports = router;

