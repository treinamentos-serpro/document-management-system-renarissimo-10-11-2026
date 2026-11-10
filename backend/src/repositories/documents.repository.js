const path = require('node:path');
const { mkdirSync } = require('node:fs');
const { stat, unlink } = require('node:fs/promises');

function createDocumentRepository(storageDirectory) {
  mkdirSync(storageDirectory, { recursive: true });
  const documents = new Map();

  function getFilePath(storageName) {
    if (path.basename(storageName) !== storageName) {
      throw new Error('Nome de armazenamento inválido.');
    }
    return path.join(storageDirectory, storageName);
  }

  return {
    insert(document) {
      documents.set(document.id, document);
      return document;
    },
    findById(id) {
      return documents.get(id);
    },
    listByOwner(owner) {
      return [...documents.values()].reverse()
        .filter((document) => document.owner === owner)
        .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
    },
    getFilePath,
    async fileExists(storageName) {
      try {
        return (await stat(getFilePath(storageName))).isFile();
      } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
      }
    },
    async removeFile(storageName) {
      await unlink(getFilePath(storageName));
    },
  };
}

module.exports = { createDocumentRepository };