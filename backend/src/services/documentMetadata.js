const { randomUUID } = require('node:crypto');
const path = require('node:path');

function normalizeOriginalName(originalName) {
  return path.posix.basename(originalName.replace(/\\/g, '/'))
    .replace(/[\x00-\x1f\x7f]/g, '') || 'documento';
}

function createDocumentMetadata(file, owner) {
  return {
    id: randomUUID(),
    originalName: normalizeOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
  };
}

function toPublicDocument({ id, originalName, size, uploadedAt, owner }) {
  return { id, originalName, size, uploadedAt, owner };
}

module.exports = { createDocumentMetadata, toPublicDocument };