# Páginas públicas do OAuth VIVOX

Páginas informativas criadas em 2026-10-24 para o aplicativo **VIVOX - Sistema**,
conhecido no produto como **VIVOX Flow**. O responsável autorizou sua criação
no domínio do sistema.

## Endereços e arquivos

| Uso no Google Auth Platform | Endereço após publicação | Arquivo |
| --- | --- | --- |
| Homepage | https://flow.vivoxmarketing.com.br/sobre/ | vivox-clientes/public/sobre/index.html |
| Política de Privacidade | https://flow.vivoxmarketing.com.br/privacidade/ | vivox-clientes/public/privacidade/index.html |
| Termos de Uso | https://flow.vivoxmarketing.com.br/termos/ | vivox-clientes/public/termos/index.html |

Os três documentos são HTML estático com CSS local em
`vivox-clientes/public/institucional.css`. Não exigem sessão, não consultam a
API e não carregam scripts ou rastreadores externos. O rodapé do login aponta
para os três documentos. A rota inicial do sistema mantém seu comportamento.

O conteúdo descreve o uso opcional do Drive para anexos, a permissão
`drive.file`, a seleção da pasta pela conta autorizada, o armazenamento dos
dados de negócio no banco, as permissões de leitura e o fato de que excluir
uma tarefa/vínculo não apaga automaticamente os arquivos do Drive.
O contato é `equipevivox@gmail.com`.

## Estado da publicação

Arquivos prontos e validados localmente. **Ainda não publicados no domínio.**
O responsável escolheu revisar antes de publicar e, após a revisão, pediu
concluir a publicação do OAuth. Esse pedido autoriza prosseguir com as páginas
necessárias. Este pacote está preparado para o fluxo Git/Coolify; não registra
push, abertura/merge de PR ou deploy já concluídos. A prévia local está em
http://127.0.0.1:5189/sobre/ (Nginx temporário para revisão).
O app OAuth permanece em **Testing**, com publicação bloqueada por branding
incompleto. A existência dessas páginas, por si só, não confirma aprovação ou
publicação pelo Google.

Painel correto: https://coolify.vivoxmarketing.com.br. Em 2026-10-24 foi
conferido, pela interface autenticada, que **Sistema VIVOX - Frontend** usa
`VIVOX-Workstation/sistemaVivox`, branch `main`, commit `HEAD`, com fonte
**VIVOX Workstation**. O endereço antigo `kpcoolify` em scripts históricos
não identifica esse ambiente.

Para publicar, seguir o fluxo Git e Coolify do projeto no escopo autorizado.
A publicação deste pacote inclui somente páginas informativas, links no login
e seus registros. Não inclui a implementação de Drive nem a retirada de Chamados. Conferir as três URLs públicas após o deploy;
resposta 200 com o HTML genérico da SPA não conta como publicação dos documentos.
Só então cadastrar esses endereços no branding e tentar **Publicar app**.

Depois de verificar **In production**, renovar OAuth com a conta autorizada,
manter a raiz Demandas gerais já configurada e validar a leitura dos anexos.
Não cadastrar URLs inexistentes, usar uma política de outra marca nem emitir
novo token enquanto a publicação continuar pendente.

## Validação local

- Build e lint do frontend passaram; permanecem avisos anteriores do projeto.
- As três páginas foram servidas pelo Nginx com a configuração real do frontend.
- Navegador em 1366 × 900 e 390 × 844: HTTP 200, títulos e URL canônica corretos,
  um título principal por página, nenhum erro de JavaScript, nenhuma chamada
  externa e nenhuma rolagem horizontal.
- Login contém os três links, com destinos HTTP 200. Capturas revisadas.
- Nenhuma API, permissão de usuário ou migration foi alterada nesta etapa.

Referências do Google: [Branding](https://support.google.com/cloud/answer/15549049)
e [status do aplicativo](https://support.google.com/cloud/answer/15549945).
