const multer = require('multer');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: error.code,
        message: tooLarge ? 'O arquivo excede o tamanho permitido.' : 'Envie somente um arquivo no campo file, sem campos adicionais.',
      },
    });
  }
  const statusByCode = { FILE_REQUIRED: 400, EMPTY_FILE: 400, DOCUMENT_NOT_FOUND: 404, ENOENT: 404 };
  const status = statusByCode[error.code] || 500;
  if (status === 500) console.error('Falha interna ao processar documento.', error);
  res.status(status).json({
    error: {
      code: status === 500 ? 'INTERNAL_ERROR' : status === 404 ? 'DOCUMENT_NOT_FOUND' : error.code,
      message: status === 500 ? 'Não foi possível concluir a operação.'
        : status === 404 ? 'Documento não encontrado.' : error.message,
    },
  });
}

module.exports = { errorHandler };