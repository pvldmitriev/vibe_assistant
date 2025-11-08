const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const projectService = require('../services/projectService');

/**
 * POST /api/analyze-idea
 * Анализирует идею пользователя и создает проект с образом продукта
 */
router.post('/', async (req, res) => {
  try {
    const { idea } = req.body;

    // Валидация
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Идея не может быть пустой'
      });
    }

    if (idea.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Идея слишком короткая. Опишите подробнее (минимум 20 символов)'
      });
    }

    if (idea.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Идея слишком длинная. Сократите до 2000 символов'
      });
    }

    console.log(`📝 Analyzing idea: "${idea.substring(0, 50)}..."`);

    // Анализ идеи через AI
    const analysis = await aiService.analyzeIdea(idea);

    // Создание проекта
    const project = projectService.createProject(idea, analysis);

    res.json({
      success: true,
      data: {
        projectId: project.id,
        problem: project.problem,
        productVision: project.productVision,
        keyFeatures: project.keyFeatures,
        createdAt: project.createdAt
      }
    });

  } catch (error) {
    console.error('Error in analyze-idea:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка анализа идеи'
    });
  }
});

/**
 * PUT /api/analyze-idea/:projectId
 * Обновляет образ продукта на основе корректировок пользователя
 */
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { productVision, keyFeatures, corrections } = req.body;

    // Валидация
    if (!productVision && !corrections) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать productVision или corrections'
      });
    }

    const project = projectService.getProject(projectId);

    let updatedVision = productVision;
    let updatedFeatures = keyFeatures;

    // Если пользователь хочет скорректировать через AI
    if (corrections) {
      const correctionPrompt = `${project.productVision}\n\nПользователь попросил скорректировать:\n${corrections}`;
      const analysis = await aiService.analyzeIdea(correctionPrompt);
      updatedVision = analysis.productVision;
      updatedFeatures = analysis.keyFeatures;
    }

    // Обновляем проект
    const updatedProject = projectService.updateProductVision(
      projectId,
      updatedVision,
      updatedFeatures
    );

    res.json({
      success: true,
      data: {
        projectId: updatedProject.id,
        productVision: updatedProject.productVision,
        keyFeatures: updatedProject.keyFeatures,
        updatedAt: updatedProject.updatedAt
      }
    });

  } catch (error) {
    console.error('Error in update product vision:', error);
    
    if (error.message === 'Проект не найден') {
      return res.status(404).json({
        success: false,
        error: 'Проект не найден'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка обновления образа продукта'
    });
  }
});

module.exports = router;

