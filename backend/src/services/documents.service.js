const { createDocumentMetadata, toPublicDocument } = require('./documentMetadata');

const errorMessages = {
  FILE_REQUIRED: 'Selecione um arquivo.',
  EMPTY_FILE: 'O arquivo não pode estar vazio.',
  DOCUMENT_NOT_FOUND: 'Documento não encontrado.',
};

function createServiceError(code) {
  return Object.assign(new Error(errorMessages[code]), { code });
}

function validateUpload(file) {
  if (!file) throw createServiceError('FILE_REQUIRED');
  if (file.size === 0) throw createServiceError('EMPTY_FILE');
}

function createDocumentService(repository) {
  async function removeRejectedUpload(storageName) {
    try {
      await repository.removeFile(storageName);
    } catch (cleanupError) {
      console.error('Falha ao remover arquivo de upload rejeitado.', cleanupError);
    }
  }

  return {
    async create(file, owner) {
      try {
        validateUpload(file);
        const document = createDocumentMetadata(file, owner);
        await repository.insert(document);
        return toPublicDocument(document);
      } catch (error) {
        if (file) await removeRejectedUpload(file.filename);
        throw error;
      }
    },
    async list(owner) {
      return (await repository.listByOwner(owner)).map(toPublicDocument);
    },
    async download(id, owner) {
      const document = await repository.findById(id);
      if (!document || document.owner !== owner || !(await repository.fileExists(document.storageName))) {
        throw createServiceError('DOCUMENT_NOT_FOUND');
      }
      return { filePath: repository.getFilePath(document.storageName), originalName: document.originalName };
    },
  };
}

module.exports = { createDocumentService };