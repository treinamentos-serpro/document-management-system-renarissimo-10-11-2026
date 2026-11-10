function createDocumentController(service) {
  return {
    async upload(req, res) {
      res.status(201).json(await service.create(req.file, req.owner));
    },
    async list(req, res) {
      res.json(await service.list(req.owner));
    },
    async download(req, res, next) {
      const document = await service.download(req.params.id, req.owner);
      res.download(document.filePath, document.originalName, {
        headers: { 'Content-Type': 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' },
      }, (error) => {
        if (error) next(error);
      });
    },
  };
}

module.exports = { createDocumentController };