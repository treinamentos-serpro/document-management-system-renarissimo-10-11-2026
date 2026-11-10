const { Router } = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const { isUtf8 } = require('node:buffer');

function createDocumentRoutes(controller, config) {
  const router = Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination: config.storageDirectory,
      filename(req, file, callback) {
        if (/^[\x00-\xff]*$/.test(file.originalname)) {
          const bytes = Buffer.from(file.originalname, 'latin1');
          if (isUtf8(bytes)) file.originalname = bytes.toString('utf8');
        }
        callback(null, randomUUID());
      },
    }),
    limits: { fileSize: config.maxFileSize + 1, files: 1, fields: 0, parts: 2 },
  });

  router.use((req, res, next) => {
    const owner = req.get('X-User-Id')?.trim();
    if (!owner || owner.length > 128 || /[\x00-\x1f\x7f]/.test(owner)) {
      return res.status(400).json({
        error: { code: 'USER_REQUIRED', message: 'Informe um usuário válido com até 128 caracteres.' },
      });
    }
    req.owner = owner;
    next();
  });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);
  return router;
}

module.exports = { createDocumentRoutes };