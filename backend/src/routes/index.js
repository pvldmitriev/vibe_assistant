const express = require('express');
const router = express.Router();

// Новые wizard routes для Cursor AI Guide
const wizardRoutes = require('./wizardRoutes');

// Старые routes (оставляем для обратной совместимости)
const ideaRoutes = require('./ideaRoutes');
const planRoutes = require('./planRoutes');
const stepRoutes = require('./stepRoutes');

// Подключаем wizard routes (основные для нового приложения)
router.use('/', wizardRoutes);

// Старые routes (deprecated)
router.use('/analyze-idea', ideaRoutes);
router.use('/generate-plan', planRoutes);
router.use('/steps', stepRoutes);

module.exports = router;

