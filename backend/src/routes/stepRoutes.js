const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');

/**
 * GET /api/steps/:projectId
 * Получить все шаги проекта
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const steps = projectService.getSteps(projectId);
    const project = projectService.getProject(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        steps,
        progress: project.progress
      }
    });

  } catch (error) {
    console.error('Error in get steps:', error);
    
    if (error.message === 'Проект не найден') {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка получения шагов'
    });
  }
});

/**
 * GET /api/steps/step/:stepId
 * Получить конкретный шаг
 */
router.get('/step/:stepId', async (req, res) => {
  try {
    const { stepId } = req.params;

    const step = projectService.getStep(stepId);

    res.json({
      success: true,
      data: step
    });

  } catch (error) {
    console.error('Error in get step:', error);
    
    if (error.message === 'Шаг не найден') {
      return res.status(404).json({
        success: false,
        error: 'Шаг не найден'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка получения шага'
    });
  }
});

/**
 * POST /api/steps/:stepId/complete
 * Отметить шаг как выполненный
 */
router.post('/:stepId/complete', async (req, res) => {
  try {
    const { stepId } = req.params;

    const step = projectService.completeStep(stepId);
    const project = projectService.getProject(step.projectId);

    res.json({
      success: true,
      data: {
        step,
        progress: project.progress
      }
    });

  } catch (error) {
    console.error('Error in complete step:', error);
    
    if (error.message === 'Шаг не найден' || error.message === 'Проект не найден') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка отметки шага'
    });
  }
});

/**
 * POST /api/steps/:stepId/uncomplete
 * Отменить выполнение шага
 */
router.post('/:stepId/uncomplete', async (req, res) => {
  try {
    const { stepId } = req.params;

    const step = projectService.uncompleteStep(stepId);
    const project = projectService.getProject(step.projectId);

    res.json({
      success: true,
      data: {
        step,
        progress: project.progress
      }
    });

  } catch (error) {
    console.error('Error in uncomplete step:', error);
    
    if (error.message === 'Шаг не найден' || error.message === 'Проект не найден') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка отмены шага'
    });
  }
});

module.exports = router;

