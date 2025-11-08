const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const projectService = require('../services/projectService');

/**
 * POST /api/generate-plan
 * Генерирует план разработки на основе образа продукта
 */
router.post('/', async (req, res) => {
  try {
    const { projectId } = req.body;

    // Валидация
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId обязателен'
      });
    }

    // Получаем проект
    const project = projectService.getProject(projectId);

    if (!project.productVision) {
      return res.status(400).json({
        success: false,
        error: 'Образ продукта не определен. Сначала проанализируйте идею.'
      });
    }

    console.log(`📋 Generating plan for project: ${projectId}`);

    // Генерация плана через AI
    const steps = await aiService.generatePlan(
      project.productVision,
      project.keyFeatures
    );

    if (!steps || steps.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Не удалось сгенерировать план. Попробуйте еще раз.'
      });
    }

    // Добавляем шаги к проекту
    const projectSteps = projectService.addSteps(projectId, steps);

    res.json({
      success: true,
      data: {
        projectId,
        steps: projectSteps,
        totalSteps: projectSteps.length
      }
    });

  } catch (error) {
    console.error('Error in generate-plan:', error);
    
    if (error.message === 'Проект не найден') {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации плана'
    });
  }
});

/**
 * GET /api/generate-plan/:projectId
 * Получить текущий план проекта
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = projectService.getProject(projectId);
    const steps = projectService.getSteps(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        productVision: project.productVision,
        keyFeatures: project.keyFeatures,
        steps,
        progress: project.progress
      }
    });

  } catch (error) {
    console.error('Error in get plan:', error);
    
    if (error.message === 'Проект не найден') {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка получения плана'
    });
  }
});

module.exports = router;

