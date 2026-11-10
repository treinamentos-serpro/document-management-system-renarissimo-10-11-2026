import { useEffect, useState } from 'react';
import { Archive, ArrowRight, CheckCircle2, CircleAlert, Files, RefreshCw, Search, UserRound } from 'lucide-react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList, { formatSize } from './components/DocumentList.jsx';
import { listDocuments, uploadDocument } from './services/documentService.js';
import './styles.css';

export default function App() {
  const [owner, setOwner] = useState('demo');
  const [ownerInput, setOwnerInput] = useState('demo');
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setDocuments([]);
    listDocuments(owner, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setDocuments(result); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [owner, refresh]);

  function changeOwner(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();
    if (!nextOwner || uploading) return;
    setOwner(nextOwner);
    setQuery('');
    setNotice('');
  }

  async function handleUpload(file) {
    setUploading(true);
    setError('');
    setNotice('');
    try {
      await uploadDocument(file, owner);
      setNotice('Documento enviado com sucesso.');
      setRefresh((current) => current + 1);
      return true;
    } catch (failure) {
      setError(failure.message);
      return false;
    } finally {
      setUploading(false);
    }
  }

  const filteredDocuments = documents.filter((document) => document.originalName.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  const totalSize = documents.reduce((total, document) => total + document.size, 0);

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="DMS início"><span className="brand-icon"><Archive size={23} /></span><span>DMS<span className="brand-divider">/</span><span className="brand-detail">Documentos</span></span></a>
          <span className="environment"><span />Ambiente demonstrativo</span>
        </div>
      </header>
      <main className="workspace">
        <div className="page-heading">
          <div><p className="eyebrow">ÁREA DE TRABALHO</p><h1>Meus documentos<span className="heading-dot">.</span></h1></div>
          <form className="owner-form" onSubmit={changeOwner}>
            <label htmlFor="owner">Identificação demonstrativa</label>
            <div className="owner-control"><UserRound size={17} aria-hidden="true" />
              <input id="owner" value={ownerInput} onChange={(event) => setOwnerInput(event.target.value)} maxLength={128} required disabled={uploading} autoComplete="off" />
              <button type="submit" className="icon-button" disabled={uploading || !ownerInput.trim() || ownerInput.trim() === owner} title="Trocar usuário" aria-label="Trocar usuário"><ArrowRight size={18} /></button>
            </div>
          </form>
        </div>
        <div className="workspace-summary"><span><Files size={17} aria-hidden="true" />{documents.length} {documents.length === 1 ? 'documento' : 'documentos'}</span><span className="summary-divider" /><span>{formatSize(totalSize)} no total</span><span className="owner-tag">{owner}</span></div>
        <UploadComponent onUpload={handleUpload} uploading={uploading} />
        {error && <div className="message error-message" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{error}</span></div>}
        {notice && <div className="message success-message" role="status"><CheckCircle2 size={18} aria-hidden="true" /><span>{notice}</span></div>}
        <section className="library-section" aria-labelledby="library-title" aria-busy={loading}>
          <div className="library-toolbar">
            <h2 id="library-title">Todos os documentos <span className="count">{documents.length}</span></h2>
            <div className="library-actions"><label className="search-control"><Search size={17} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar documento" aria-label="Buscar documento" /></label>
              <button className="icon-button" type="button" onClick={() => { setNotice(''); setRefresh((current) => current + 1); }} disabled={loading || uploading} title="Atualizar documentos" aria-label="Atualizar documentos"><RefreshCw size={18} className={loading ? 'spinning' : ''} /></button>
            </div>
          </div>
          <DocumentList documents={filteredDocuments} owner={owner} loading={loading} searching={Boolean(query)} onError={setError} />
        </section>
        <footer className="workspace-footer"><span>DMS / Document Management System</span><span>Arquivos locais · Sessão temporária</span></footer>
      </main>
    </>
  );
}
