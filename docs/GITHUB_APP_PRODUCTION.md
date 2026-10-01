# GitHub App em produção

O backend precisa de `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`,
`GITHUB_APP_SLUG` e `FRONTEND_URL` no ambiente de execução.

No Coolify, salve `GITHUB_APP_PRIVATE_KEY` com as quebras de linha reais do
arquivo PEM e habilite **Is Multiline**. A chave não deve ser incluída no Git
nem copiada para logs. Aplique a configuração ao container antes de testar.

## Falha diagnosticada em 17/09/2026

O backend de produção registrava `secretOrPrivateKey must be an asymmetric key
when using RS256`. A chave salva era válida, mas continha quebras de linha
representadas por `\n`; o valor processado pelo Coolify duplicava essas barras.
O normalizador antigo deixava barras residuais e a assinatura falhava antes
de consultar o GitHub.

A configuração de produção foi alterada para PEM multilinha. O código também
aceita escapes duplicados e aspas envolventes, e passa a distinguir falhas de
autenticação/comunicação de uma instalação sem repositórios.

## Validação

- Consultar instalações com autenticação do app deve retornar HTTP 200.
- No DevBoard, **Conectar repositório GitHub** deve abrir a lista de repositórios
  da instalação existente.
- Uma falha de consulta deve aparecer como erro, sem ser apresentada como lista
  vazia ou provocar nova instalação automaticamente.
- Testes: `cd backend` e `npm test -- --runInBand github-app.service.spec.ts`.

O deploy deste ambiente usa `kelson-cosme/sistemaVivox`, branch `main`.
Alterações locais no código precisam ser publicadas separadamente; corrigir
uma variável no Coolify não publica essas alterações.
