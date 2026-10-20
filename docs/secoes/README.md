# Fichas das seções

Uma ficha por seção do sistema. O mapa geral e as ligações entre seções estão em
[`docs/CEREBRO.md`](../CEREBRO.md).

Toda ficha segue o mesmo molde:

1. **Para que serve:** em linguagem de quem usa.
2. **Onde fica:** rotas, arquivos do front e do backend.
3. **Dados:** models e endpoints.
4. **Quem acessa:** papel e módulo.
5. **Como funciona:** regras que não são óbvias.
6. **Conversa com:** outras seções, com o que vai e o que volta.
7. **Pendências e cuidados:** defeitos, limites, o que falta.
8. **Registro de mudanças:** uma linha por PR, mais recente no topo:
   `AAAA-MM-DD · branch · o que mudou para quem usa · arquivos principais · pendências`.

Ao abrir um PR: atualize a ficha da seção (itens 1–7 se mudaram, item 8 sempre).
Se a mudança afeta outra seção, registre lá também e no cérebro.
