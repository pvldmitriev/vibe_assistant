const { v4: uuidv4 } = require('uuid');

/**
 * In-memory хранилище проектов для MVP
 * В production версии заменить на базу данных
 */
class ProjectService {
  constructor() {
    this.projects = new Map();
    this.steps = new Map();
  }

  /**
   * Создать новый проект
   */
  createProject(idea, analysis) {
    const projectId = uuidv4();
    const project = {
      id: projectId,
      idea,
      problem: analysis.problem,
      productVision: analysis.productVision,
      keyFeatures: analysis.keyFeatures || [],
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: {
        total: 0,
        completed: 0
      }
    };

    this.projects.set(projectId, project);
    console.log(`📁 Project created: ${projectId}`);
    
    return project;
  }

  /**
   * Получить проект по ID
   */
  getProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Проект не найден');
    }
    return project;
  }

  /**
   * Обновить образ продукта
   */
  updateProductVision(projectId, productVision, keyFeatures) {
    const project = this.getProject(projectId);
    project.productVision = productVision;
    if (keyFeatures) {
      project.keyFeatures = keyFeatures;
    }
    project.updatedAt = new Date().toISOString();
    
    console.log(`📝 Product vision updated for project: ${projectId}`);
    return project;
  }

  /**
   * Добавить шаги к проекту
   */
  addSteps(projectId, steps) {
    const project = this.getProject(projectId);
    
    const projectSteps = steps.map((step, index) => {
      const stepId = uuidv4();
      const stepData = {
        id: stepId,
        projectId,
        order: step.order || index + 1,
        title: step.title,
        prompt: step.prompt,
        dod: Array.isArray(step.dod) ? step.dod : [],
        estimatedMinutes: step.estimatedMinutes || 30,
        completed: false,
        completedAt: null
      };
      
      this.steps.set(stepId, stepData);
      return stepData;
    });

    project.steps = projectSteps.map(s => s.id);
    project.progress.total = projectSteps.length;
    project.updatedAt = new Date().toISOString();
    
    console.log(`📋 Added ${projectSteps.length} steps to project: ${projectId}`);
    return projectSteps;
  }

  /**
   * Получить шаги проекта
   */
  getSteps(projectId) {
    const project = this.getProject(projectId);
    
    return project.steps
      .map(stepId => this.steps.get(stepId))
      .filter(step => step !== undefined)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Получить конкретный шаг
   */
  getStep(stepId) {
    const step = this.steps.get(stepId);
    if (!step) {
      throw new Error('Шаг не найден');
    }
    return step;
  }

  /**
   * Отметить шаг как выполненный
   */
  completeStep(stepId) {
    const step = this.getStep(stepId);
    
    if (step.completed) {
      return step;
    }

    step.completed = true;
    step.completedAt = new Date().toISOString();

    // Обновить прогресс проекта
    const project = this.getProject(step.projectId);
    const completedSteps = project.steps.filter(id => {
      const s = this.steps.get(id);
      return s && s.completed;
    });
    
    project.progress.completed = completedSteps.length;
    project.updatedAt = new Date().toISOString();

    console.log(`✅ Step completed: ${stepId} (${project.progress.completed}/${project.progress.total})`);
    
    return step;
  }

  /**
   * Отменить выполнение шага
   */
  uncompleteStep(stepId) {
    const step = this.getStep(stepId);
    
    if (!step.completed) {
      return step;
    }

    step.completed = false;
    step.completedAt = null;

    // Обновить прогресс проекта
    const project = this.getProject(step.projectId);
    const completedSteps = project.steps.filter(id => {
      const s = this.steps.get(id);
      return s && s.completed;
    });
    
    project.progress.completed = completedSteps.length;
    project.updatedAt = new Date().toISOString();

    console.log(`↩️  Step uncompleted: ${stepId}`);
    
    return step;
  }

  /**
   * Получить все проекты (для отладки)
   */
  getAllProjects() {
    return Array.from(this.projects.values());
  }

  /**
   * Удалить проект
   */
  deleteProject(projectId) {
    const project = this.getProject(projectId);
    
    // Удалить все шаги проекта
    project.steps.forEach(stepId => {
      this.steps.delete(stepId);
    });
    
    this.projects.delete(projectId);
    console.log(`🗑️  Project deleted: ${projectId}`);
  }
}

module.exports = new ProjectService();

