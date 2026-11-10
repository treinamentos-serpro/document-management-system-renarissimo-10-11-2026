const express = require('express');

const { loadConfig } = require('./config');
const { createDocumentRepository } = require('./repositories/documents.repository');
const { createDocumentService } = require('./services/documents.service');
const { createDocumentController } = require('./controllers/documents.controller');
const { createDocumentRoutes } = require('./routes/documents.routes');
const { errorHandler } = require('./middlewares/errorHandler');

function createApp(options = {}) {
  const config = { ...loadConfig(), ...options };
  const repository = createDocumentRepository(config.storageDirectory);
  const service = createDocumentService(repository);
  const controller = createDocumentController(service);
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use(createDocumentRoutes(controller, config));
  app.use(errorHandler);
  return app;
}

const app = createApp();

if (require.main === module) {
  const { port } = loadConfig();
  app.listen(port, () => {
    console.log(`DMS backend ouvindo na porta ${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
