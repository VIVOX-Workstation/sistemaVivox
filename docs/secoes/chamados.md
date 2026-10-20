# Chamados

## Para que serve

Suporte depois da entrega: o cliente (pelo portal) ou a equipe abre um chamado
sobre um serviço ou entrega, com categoria, urgência e prazo de resposta (SLA).

## Onde fica

| Parte | Caminho |
|---|---|
| Rota | `/gp/workspace/all` (menu "Chamados") |
| Telas | `components/clean/ChamadosView.tsx`; janelas `components/gp/ChamadoModal.tsx`, `NovoChamadoModal.tsx` |
| Backend | `backend/src/chamados/` |

## Dados

`Chamado` (cliente, serviço, `itemPlanejadoId`, categoria, urgência, `slaVencimento`,
status ABERTO / EM_ANDAMENTO / RESOLVIDO, `tarefaId`, proprietário),
`ChamadoComentario`. Endpoints `/chamados/*`.

## Quem acessa

Módulos **GP** ou **CLIENTES**.

## Como funciona

- O SLA é calculado na criação a partir da urgência.
- Todo chamado cria uma `Tarefa` junto (título com emoji, tag `chamado`), pelo serviço legado de tarefas — **sem quadro nem coluna**.

## Conversa com

- **Clientes / Perfil:** botão "Criar chamado" e indicador de chamados.
- **Planejamento:** chamado pode apontar para um item planejado.
- **Minhas tarefas:** a tarefa do chamado aparece para o responsável.
- **Dashboard:** abertos, SLA vencido, recentes.
- **Demandas gerais:** hoje não aparece lá.

## Pendências e cuidados

- **Plano (etapa 5 do cérebro):** criar a tarefa no quadro "Chamados" de Demandas gerais (colunas Novo → Em atendimento → Aguardando cliente → Resolvido) e o status do chamado acompanhar a coluna; botão "Abrir na Demanda" e SLA visível na tarefa.

## Registro de mudanças

- 2026-10-16 · `style/telas-clean` · Visual clean da Central de chamados (`ChamadosView`) · `VivoxGP.tsx` · —
- 2026-08-25 · — · Formulário completo e SLA automático · `backend/src/chamados` · —
- 2026-08-23 · — · Central de chamados · — · —
