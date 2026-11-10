import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument } from '../services/documentService.js';

export default function DownloadButton({ document, owner, onError }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadDocument(document, owner);
    } catch (error) {
      onError(error.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button className="icon-button download-button" type="button" onClick={handleDownload}
      disabled={downloading} title="Baixar documento" aria-label={`Baixar ${document.originalName}`}>
      {downloading ? <LoaderCircle size={19} className="spinning" aria-hidden="true" /> : <Download size={19} aria-hidden="true" />}
    </button>
  );
}