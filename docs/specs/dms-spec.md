# Especificação - Document Management System

## 1. Objetivo

Permitir envio, listagem e download de documentos por usuário, com arquivos
no filesystem local e metadados em memória, em uma aplicação demonstrativa.

## 2. Escopo

### Dentro do escopo

- Upload de um documento não vazio por requisição.
- Listagem por usuário, do documento mais recente ao mais antigo.
- Download pelo identificador, preservando nome original e conteúdo binário.
- Interface React com identificação de usuário, busca local e estados de operação.
- Validação de entrada, mensagens de erro e testes automatizados.

### Fora do escopo

- Armazenamento externo, nuvem, serviços terceiros de upload e banco de dados.
- Versionamento, exclusão, edição, compartilhamento e paginação de documentos.
- Autenticação real, cadastro, recuperação de senha e antivírus.
- Recuperação de metadados e limpeza automática de arquivos órfãos.

O cabeçalho `X-User-Id` identifica o usuário de forma demonstrativa; não autentica
sua identidade. Qualquer cliente pode informar outro identificador. Usar somente
em ambiente local de demonstração e em uma instância. O frontend inicia com `demo`.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | Enviar documento. | Arquivo válido gravado localmente; resposta `201` com metadados públicos. |
| RF-02 | Listar documentos do usuário. | Somente registros do usuário, por data decrescente, ou `[]`. Em empate, o último registro aparece primeiro. |
| RF-03 | Baixar documento. | Bytes originais e cabeçalho de download com nome original. |
| RF-04 | Isolar documentos por identificador. | As três operações exigem identificação; documento de outro usuário retorna `404`. |
| RF-05 | Apresentar documentos. | Nome, tamanho, data e download em layout responsivo; busca local por nome sem distinguir maiúsculas de minúsculas. |
| RF-06 | Tratar estados. | Carregamento, lista vazia, sucesso e erro; bloquear reenvio durante upload e atualizar listagem após sucesso. |
| RF-07 | Trocar usuário. | Recarregar listagem e cancelar consultas anteriores; bloquear troca durante upload. |
| RF-08 | Preservar saúde. | `GET /health` retorna `200` e `{"status":"ok"}`, sem identificação. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Node.js/Express CommonJS, JavaScript, React/Vite ESM e componentes funcionais. |
| RNF-02 | Arquivos exclusivamente em `backend/storage`, via `multer.diskStorage`, sem buffers de upload em memória. |
| RNF-03 | Metadados exclusivamente em memória; reinício perde registros, mas não apaga arquivos. |
| RNF-04 | Camadas `routes -> controllers -> services -> repositories`, sem HTTP nas camadas internas. |
| RNF-05 | Ambiente: `PORT=3000` e `MAX_FILE_SIZE_BYTES=10485760` por padrão. Rejeitar valores não inteiros ou não positivos e portas acima de 65535. |
| RNF-06 | Exatamente um arquivo no campo `file`, sem campos adicionais; rejeitar vazio e tamanho excedido. Sem restrição de extensão nesta fase. |
| RNF-07 | Nomes físicos únicos, independentes do nome original; impedir traversal e não publicar armazenamento como conteúdo estático. |
| RNF-08 | Mensagens em português, sem stack traces ou caminhos internos nas respostas; nunca executar arquivos recebidos. |
| RNF-09 | Frontend usa `fetch` com `/api`; proxy Vite remove esse prefixo ao encaminhar ao backend. |
| RNF-10 | Testes `node:test` com estado isolado, portas efêmeras e diretórios temporários. |
| RNF-11 | Interface desktop/celular com rótulos acessíveis, foco visível e estados de operação. |

## 5. Modelo de dados (metadados do documento)

| Campo | Tipo | Descrição e validação |
| --- | --- | --- |
| `id` | string | UUID gerado pelo servidor, único e imutável. |
| `originalName` | string | Nome sem componentes de caminho e caracteres de controle, preservando acentos; usar `documento` se vazio após normalização. |
| `size` | number | Inteiro em bytes, maior que zero e menor ou igual ao limite. |
| `uploadedAt` | string | Data UTC em ISO 8601 gerada pelo servidor. |
| `owner` | string | `X-User-Id` sem espaços externos, não vazio, até 128 caracteres, sem caracteres de controle. |
| `storageName` | string | UUID do nome físico, interno e nunca exposto na API. |

O repositório usa um `Map` indexado por `id`. Nomes originais iguais são permitidos
e geram documentos independentes. O caminho absoluto deriva somente do diretório
local e do nome físico, nunca do nome original.

## 6. Contratos de API

### Convenções

As rotas abaixo são do backend; o frontend acrescenta `/api`. As três rotas de
documentos exigem `X-User-Id`: ausência ou valor inválido retorna `400`, código
`USER_REQUIRED`. Metadados são JSON, datas ISO 8601 e tamanhos em bytes. O frontend
não define `Content-Type` manualmente ao enviar `FormData`.

Exemplo de metadados públicos:

```json
{
  "id": "e863cf3c-3a5e-4411-937d-3e45ac596b8c",
  "originalName": "relatório.pdf",
  "size": 2048,
  "uploadedAt": "2026-11-10T12:00:00.000Z",
  "owner": "alice"
}
```

### POST /upload

- Entrada: `multipart/form-data` com exatamente um campo de arquivo `file`.
- Sucesso: `201 Created` com objeto de metadados públicos.
- `400`: arquivo ausente (`FILE_REQUIRED`), vazio (`EMPTY_FILE`), campo inesperado,
  múltiplos arquivos ou campos adicionais (códigos `LIMIT_*` do multer).
- `413`: tamanho excedido (`LIMIT_FILE_SIZE`).
- `500`: falha de armazenamento ou registro (`INTERNAL_ERROR`).
- Registrar metadados após gravação; em falha de registro ou validação posterior,
  remover o arquivo recém-criado e registrar eventuais falhas de limpeza.

### GET /documents

- Entrada: sem corpo; identificação no cabeçalho.
- Sucesso: `200 OK`, array ordenado de metadados públicos; `[]` se vazio.
- `500`: falha interna (`INTERNAL_ERROR`). Sem paginação nesta fase.

### GET /documents/:id/download

- Entrada: identificador no caminho e usuário no cabeçalho.
- Sucesso: `200 OK`, binário, `Content-Type: application/octet-stream`,
  `Content-Disposition: attachment` com nome original codificado adequadamente
  e `X-Content-Type-Options: nosniff`.
- `404`: documento inexistente, de outro usuário ou sem arquivo físico
  (`DOCUMENT_NOT_FOUND`), sem distinguir esses casos para o cliente.
- `500`: demais falhas internas anteriores ao envio dos cabeçalhos.
- Em falha após início da transferência, encerrar resposta sem tentar enviar JSON.

### GET /health

Sucesso: `200 OK`, `{"status":"ok"}`; dispensa identificação.

### Formato dos erros

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Selecione um arquivo."
  }
}
```

Falhas internas usam mensagem genérica ao cliente e detalhes apenas no servidor.

## 7. Decisões arquiteturais

### Backend

- `config/index.js`: validar ambiente e resolver diretório local fixo.
- `routes/documents.routes.js`: rotas, identificação anterior à gravação e multer
  com limite configurado, nomes físicos UUID e tratamento de nomes UTF-8.
- `controllers/documents.controller.js`: adaptar HTTP, chamar services e responder
  com JSON ou download, sem regras de persistência.
- `services/documents.service.js`: criação, normalização de nomes, respostas públicas,
  listagem por dono, autorização de download e compensação de falhas.
- `repositories/documents.repository.js`: encapsular `Map` e filesystem, criar
  diretório e validar nomes físicos antes de resolver caminhos.
- `middlewares/errorHandler.js`: centralizar conversão de erros para HTTP.
- `app.js`: compor dependências e exportar app e fábrica para testes isolados.

### Frontend

- `App.jsx`: usuário ativo, carregamento, busca, mensagens e atualização da lista.
- `components/UploadComponent.jsx`: selecionar, limpar seleção e enviar arquivo.
- `components/DocumentList.jsx`: lista, tamanho, data e estados vazios.
- `components/DownloadButton.jsx`: download binário e bloqueio de cliques duplicados.
- `services/documentService.js`: `fetch`, cabeçalhos, erros e downloads.
- Hooks funcionais, CSS responsivo e ícones Lucide nos controles.

### Riscos aceitos

Identificação falsificável, perda de metadados ao reiniciar e arquivos órfãos.
Instâncias não compartilham metadados. Sem quota cumulativa, expiração ou antivírus.
Falhas de limpeza podem deixar resíduos e devem ser registradas. Não expor à internet.

## 8. Plano de execução

1. **Especificação:** aprovar este documento, contratos, limites e riscos.
2. **Persistência:** configuração, arquivos locais e repositório em memória;
   verificar nomes únicos, isolamento de estado e bloqueio de traversal.
3. **Regras:** criação, listagem e autorização de download; testar compensação,
   ordenação e exclusão de campos internos das respostas.
4. **API:** conectar rotas, multer, controllers e erros; preservar `/health` e
   verificar contratos com servidor efêmero e armazenamento temporário.
5. **Interface:** componentes e serviço `fetch`; upload, identificação, listagem,
   busca e download com estados acessíveis e responsivos.
6. **Integração:** testar dois usuários, erros, nomes acentuados, conteúdo binário,
   download e uso desktop/celular; documentar inicialização e limitações.

### Critérios de conclusão

- `npm test --prefix backend` e `npm test --prefix frontend` aprovados.
- `npm run build --prefix frontend` aprovado.
- Upload e download preservam conteúdo; usuários diferentes não compartilham lista.
- Uploads rejeitados não deixam resíduos em condições normais de filesystem.
- Reinício perde metadados sem apagar arquivos e essa limitação está documentada.
- Nenhum provedor externo, banco ou funcionalidade fora do escopo adicionado.