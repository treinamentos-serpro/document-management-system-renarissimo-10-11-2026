async function request(path, owner, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'X-User-Id': owner },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível concluir a operação.');
  }
  return response;
}

export async function listDocuments(owner, signal) {
  return (await request('/documents', owner, { signal })).json();
}

export async function uploadDocument(file, owner) {
  const body = new FormData();
  body.append('file', file);
  return (await request('/upload', owner, { method: 'POST', body })).json();
}

export async function downloadDocument(document, owner) {
  const response = await request(`/documents/${encodeURIComponent(document.id)}/download`, owner);
  let blob;
  try {
    blob = await response.blob();
  } catch {
    throw new Error('Não foi possível concluir o download. Tente novamente.');
  }
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = document.originalName;
  window.document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}