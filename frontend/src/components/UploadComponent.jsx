import { useRef, useState } from 'react';
import { FilePlus2, Upload, LoaderCircle, X } from 'lucide-react';

export default function UploadComponent({ onUpload, uploading }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;
    if (await onUpload(file)) {
      setFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="section-heading">
        <FilePlus2 size={20} aria-hidden="true" />
        <h2 id="upload-title">Novo documento</h2>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker">
          <span>Arquivo</span>
          <input ref={inputRef} type="file" disabled={uploading}
            onChange={(event) => setFile(event.target.files[0] || null)} />
        </label>
        {file && !uploading && (
          <button type="button" className="icon-button" title="Limpar seleção" aria-label="Limpar seleção"
            onClick={() => { setFile(null); inputRef.current.value = ''; }}>
            <X size={18} aria-hidden="true" />
          </button>
        )}
        <button className="primary-button" type="submit" disabled={!file || uploading}>
          {uploading ? <LoaderCircle size={18} className="spinning" aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
          {uploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
    </section>
  );
}