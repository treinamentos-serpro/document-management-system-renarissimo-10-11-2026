const { randomUUID } = require('node:crypto');
const path = require('node:path');

function publicDocument({ storageName, ...metadata }) {
  return metadata;
}

function createDocumentService(repository) {
  return {
    async create(file, owner) {
      if (!file) throw Object.assign(new Error('Selecione um arquivo.'), { code: 'FILE_REQUIRED' });
      try {
        if (file.size === 0) {
          throw Object.assign(new Error('O arquivo não pode estar vazio.'), { code: 'EMPTY_FILE' });
        }
        const document = {
          id: randomUUID(),
          originalName: path.posix.basename(file.originalname.replace(/\\/g, '/'))
            .replace(/[\x00-\x1f\x7f]/g, '') || 'documento',
          size: file.size,
          uploadedAt: new Date().toISOString(),
          owner,
          storageName: file.filename,
        };
        await repository.insert(document);
        return publicDocument(document);
      } catch (error) {
        try {
          await repository.removeFile(file.filename);
        } catch (cleanupError) {
          console.error('Falha ao remover arquivo de upload rejeitado.', cleanupError);
        }
        throw error;
      }
    },
    async list(owner) {
      return (await repository.listByOwner(owner)).map(publicDocument);
    },
    async download(id, owner) {
      const document = await repository.findById(id);
      if (!document || document.owner !== owner || !(await repository.fileExists(document.storageName))) {
        throw Object.assign(new Error('Documento não encontrado.'), { code: 'DOCUMENT_NOT_FOUND' });
      }
      return { filePath: repository.getFilePath(document.storageName), originalName: document.originalName };
    },
  };
}

module.exports = { createDocumentService };