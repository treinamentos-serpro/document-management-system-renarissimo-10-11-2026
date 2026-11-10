# Document Management System com GitHub Copilot

Aplicação demonstrativa para upload, listagem e download de documentos por usuário.
Arquivos ficam em `backend/storage`, via `multer.diskStorage`; os metadados ficam
somente em memória. A [especificação completa](docs/specs/dms-spec.md) detalha
requisitos, contratos, arquitetura e critérios de aceite.

## Requisitos e instalação

Node.js 24 ou superior e npm. Na raiz do repositório:

```bash
npm install --prefix backend
npm install --prefix frontend
```

## Executar localmente

Em um terminal, na raiz:

```bash
npm start --prefix backend
```

Em outro terminal, também na raiz:

```bash
npm run dev --prefix frontend
```

Acesse `http://localhost:5173`. O frontend encaminha `/api` ao backend em
`http://localhost:3000`. Se a porta do frontend estiver ocupada, use a URL exibida
pelo Vite. Não inicie comandos relativos à raiz a partir de `frontend` ou `backend`
sem ajustar o caminho; por exemplo, de `frontend`, use `cd ../backend`.

### Configuração por ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta do backend, inteiro de 1 a 65535. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite por arquivo (10 MiB por padrão), inteiro positivo. |
| `API_PROXY_TARGET` | `http://localhost:3000` | Destino do proxy de desenvolvimento Vite. |

As variáveis são lidas do ambiente do processo; arquivos `.env` não são carregados
automaticamente pelo backend. Para portas alternativas:

```bash
PORT=3001 MAX_FILE_SIZE_BYTES=20971520 npm start --prefix backend
API_PROXY_TARGET=http://localhost:3001 npm run dev --prefix frontend -- --port 5174
```

Execute as duas linhas em terminais separados. A pasta de armazenamento é fixa,
criada automaticamente e precisa de permissão de escrita.

## API

Exceto `/health`, as rotas exigem `X-User-Id`, um identificador não vazio com até
128 caracteres. A interface usa `demo` inicialmente e permite trocar o usuário.

| Método | Rota do backend | Resposta de sucesso |
| --- | --- | --- |
| `GET` | `/health` | `200`, `{"status":"ok"}`. |
| `POST` | `/upload` | `201`, metadados do documento. Multipart com um único arquivo no campo `file`. |
| `GET` | `/documents` | `200`, array de documentos do usuário, mais recentes primeiro. |
| `GET` | `/documents/:id/download` | `200`, conteúdo binário como anexo com nome original. |

Exemplos com um arquivo local existente:

```bash
curl -H 'X-User-Id: alice' -F 'file=@/caminho/relatorio.pdf' http://localhost:3000/upload
curl -H 'X-User-Id: alice' http://localhost:3000/documents
curl -H 'X-User-Id: alice' -OJ http://localhost:3000/documents/IDENTIFICADOR/download
```

Arquivos ausentes, vazios ou campos inesperados retornam `400`; tamanho excedido,
`413`; documentos inexistentes, de outro usuário ou sem arquivo físico, `404`.
Erros usam `{"error":{"code":"...","message":"..."}}`, sem caminhos internos.

## Testes e build

```bash
npm test --prefix backend
npm test --prefix frontend
npm run build --prefix frontend
```

Testes backend usam diretórios temporários e portas efêmeras, verificando isolamento
por usuário, limites, limpeza de falhas, nomes acentuados e preservação de bytes.
Testes frontend verificam o serviço HTTP. Para validar manualmente, envie um arquivo,
confira a listagem e o download, troque de usuário e confira a lista vazia, volte ao
usuário original e teste busca, arquivo vazio e limite de tamanho.

O build gera `frontend/dist`. Em produção seria necessário configurar o servidor
HTTP para encaminhar `/api` ao backend; o proxy aqui é de desenvolvimento.

## Arquitetura e limitações

Backend: `routes -> controllers -> services -> repositories`, com configuração e
tratamento HTTP de erros nos limites. Frontend: componentes React e serviço `fetch`.
Não há armazenamento externo, banco de dados ou execução de arquivos recebidos.

**Não é autenticação:** qualquer cliente pode forjar `X-User-Id`. Não exponha esta
demonstração à internet. Ao reiniciar o backend, a lista é perdida, mas os arquivos
continuam no disco e não podem ser recuperados pela API. Não há limpeza automática,
quota cumulativa de disco, antivírus nem suporte a múltiplas instâncias.

O Vite `8.0.16` herdado do projeto apresenta uma vulnerabilidade alta segundo
`npm audit`. Essa versão foi preservada nesta implementação; revise sua atualização
separadamente. Não aplique `npm audit fix --force` sem avaliar compatibilidade.

## Exercício original

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey renarissimo!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-renarissimo-10-11-2026/issues/1)

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

