const path = require('node:path');

function positiveInteger(value, fallback, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }
  return parsed;
}

function loadConfig(env = process.env) {
  const port = positiveInteger(env.PORT, 3000, 'PORT');
  if (port > 65535) throw new Error('PORT deve ser menor ou igual a 65535.');
  return {
    port,
    maxFileSize: positiveInteger(env.MAX_FILE_SIZE_BYTES, 10485760, 'MAX_FILE_SIZE_BYTES'),
    storageDirectory: path.resolve(__dirname, '../../storage'),
  };
}

module.exports = { loadConfig };