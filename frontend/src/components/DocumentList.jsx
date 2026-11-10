import { FileText, FolderOpen, LoaderCircle, SearchX } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

export function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${(size / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`;
  return `${(size / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function DocumentList({ documents, owner, loading, searching, onError }) {
  if (loading) return <div className="empty-state" role="status"><LoaderCircle className="spinning" size={30} />Carregando documentos...</div>;
  if (!documents.length) {
    return (
      <div className="empty-state">
        {searching ? <SearchX size={36} strokeWidth={1.4} /> : <FolderOpen size={42} strokeWidth={1.3} />}
        <h3>{searching ? 'Nenhum resultado' : 'Nenhum documento'}</h3>
      </div>
    );
  }
  return (
    <div className="document-table" role="table" aria-label="Documentos do usuário">
      <div className="document-row table-header" role="row">
        <span role="columnheader">Nome</span><span role="columnheader">Tamanho</span>
        <span role="columnheader">Enviado em</span><span role="columnheader" className="sr-only">Ações</span>
      </div>
      {documents.map((document) => (
        <div className="document-row" role="row" key={document.id}>
          <div className="document-name" role="cell">
            <span className="file-symbol"><FileText size={22} strokeWidth={1.5} aria-hidden="true" /></span>
            <span className="filename" title={document.originalName}>{document.originalName}</span>
          </div>
          <span role="cell" className="document-size">{formatSize(document.size)}</span>
          <time role="cell" dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time>
          <div role="cell" className="document-action"><DownloadButton document={document} owner={owner} onError={onError} /></div>
        </div>
      ))}
    </div>
  );
}