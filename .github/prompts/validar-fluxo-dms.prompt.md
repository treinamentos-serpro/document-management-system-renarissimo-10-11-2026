---
description: "Valida upload, listagem e download do DMS, incluindo isolamento por usuário e tratamento de erros."
name: validar-fluxo-dms
argument-hint: "Cenário específico ou fluxo completo"
agent: agent
---

# Validar o fluxo de documentos do DMS

Valide o cenário `${input:cenario:fluxo completo ou comportamento a verificar}`
sem modificar o código da aplicação.

Use as [instruções do projeto](../copilot-instructions.md) e a
[especificação do DMS](../../docs/specs/dms-spec.md) como critérios de aceite.

## Verificações

1. Confira as rotas de upload, listagem e download, o registro do roteador e a
   separação entre routes, controllers, services e repositories.
2. Confirme armazenamento local com `multer.diskStorage`, metadados em memória
   e cliente frontend com `fetch` pelo prefixo `/api`.
3. Execute os comandos abaixo a partir da raiz do repositório, selecionando os
   checks relevantes ao cenário e informando os resultados reais:

   ```bash
   npm test --prefix backend
   npm test --prefix frontend
   npm run build --prefix frontend
   ```

4. Quando houver ambiente de integração disponível, verifique envio de arquivo,
   presença na lista e download com os mesmos bytes e nome original. Confira
   também identificação obrigatória, isolamento entre dois usuários, arquivo
   vazio, tamanho excedido e documento inexistente.
5. Se houver navegador de teste disponível, confira a interface em desktop e
   celular, incluindo carregamento, erros, lista vazia e ações de upload e download.
   Caso contrário, declare que a validação visual não foi realizada.

## Cuidados

- Reutilize os testes e helpers existentes; use armazenamento temporário e
  estado isolado, sem enviar, apagar ou modificar documentos reais do usuário.
- Não reinicie servidores em uso nem instale dependências sem autorização.
- Não adicione armazenamento externo, persistência de metadados ou autenticação.
- Não crie commits, faça push ou altere workflows durante esta validação.
- Se algo falhar, relate o problema; não faça correções automaticamente.

## Entrega

Apresente uma tabela com `Verificação`, `Resultado` e `Evidência`. Diferencie
checagens aprovadas, reprovadas e não executadas. Para falhas, indique arquivo,
causa provável e próximo passo. Não declare sucesso para verificações não realizadas.