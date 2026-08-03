import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = "C:/Users/leand/Documents/Codex/2026-05-28/files-mentioned-by-the-user-prompts/framework-v1.1";
const outputPath = path.join(root, "Prompts Importantes v1.1.xlsx");

const workbook = Workbook.create();

function addSheet(name, headers, rows) {
  const sheet = workbook.worksheets.add(name);
  const values = [headers, ...rows];
  const rowCount = values.length;
  const colCount = headers.length;
  const endCol = String.fromCharCode("A".charCodeAt(0) + colCount - 1);
  const fullRange = sheet.getRange(`A1:${endCol}${rowCount}`);
  fullRange.values = values;
  fullRange.format = {
    font: { name: "Aptos", size: 10, color: "#1F2937" },
    borders: { preset: "all", style: "thin", color: "#D1D5DB" },
    verticalAlignment: "top",
    wrapText: true,
  };
  sheet.getRange(`A1:${endCol}1`).format = {
    fill: { type: "solid", color: "#0F766E" },
    font: { name: "Aptos", size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
  sheet.freezePanes.freezeRows(1);
  fullRange.format.autofitColumns();
  fullRange.format.autofitRows();
  return sheet;
}

addSheet("Como usar", [
  "Passo",
  "Acao",
  "Resultado esperado",
], [
  [1, "Comece por L1_TRIAGE na aba Fluxo v1.1", "Diagnostico de entrada e ponto de partida correto"],
  [2, "Use a aba Roteamento para confirmar o proximo prompt", "Sem pular etapas importantes"],
  [3, "Abra o arquivo Markdown indicado na coluna Arquivo Markdown", "Prompt completo pronto para copiar/usar"],
  [4, "Atualize os documentos da aba Arquivos durante o ciclo", "Continuidade e rastreabilidade"],
  [5, "Use guardrails antes de tarefas de codigo", "Menos risco em areas sensiveis"],
  [6, "Audite, corrija e valide em contextos separados", "Menos viés e mais confiabilidade"],
  [7, "Feche o ciclo com retrospectiva", "Aprendizados viram backlog ou PRD v1.1"],
]);

const fluxoRows = [
  [0, "L1_TRIAGE", "Entrada", "Sempre, antes de qualquer prompt", "Obrigatorio", "Contexto do usuario + arquivos existentes", "Diagnostico e proximo prompt", "docs/agent/TRIAGE.md"],
  [1, "AGENT_RULES", "Base", "Todo projeto", "Obrigatorio", "Nenhuma ou regras existentes", "Regras operacionais do agente", "docs/agent/agent-operating-rules.md"],
  [2, "PRE_PRD", "Produto", "Projeto novo com ideia inicial", "Obrigatorio para projeto novo", "Ideia + escopo bruto", "PRE_PRD_ESCOPO.md", "Prompt original da planilha"],
  [3, "PRD_MASTER", "Produto", "Existe Pre-PRD, mas nao PRD", "Obrigatorio", "PRE_PRD_ESCOPO.md", "PRD.md", "Prompt original da planilha"],
  [4, "PRD_REVIEW", "Produto", "Existe PRD sem revisao critica", "Obrigatorio", "PRD.md", "Relatorio de revisao", "Prompt original da planilha"],
  [5, "PRD_IMPROVE", "Produto", "Revisao apontou melhorias", "Condicional", "PRD.md + revisao", "PRD melhorado", "Prompt original da planilha"],
  [6, "L6_BROWNFIELD", "Produto", "Projeto ja existe sem documentacao confiavel", "Condicional", "Codebase existente", "BROWNFIELD_ANALYSIS.md", "docs/product/BROWNFIELD_ANALYSIS.md"],
  [7, "IMPLEMENTATION_PLAN", "Implementacao", "PRD revisado aprovado", "Obrigatorio", "PRD.md", "PLANO_IMPLEMENTACAO.md", "Prompt original da planilha"],
  [8, "IMPLEMENTATION_PLAN_UIUX", "Implementacao UI/UX", "PRD UI/UX revisado aprovado", "Condicional", "PRD + UI_UX_GUIDE.md", "PLANO_IMPLEMENTACAO.md", "Prompt original da planilha"],
  [9, "SPRINT_0", "Preparacao", "Antes da primeira feature", "Obrigatorio", "Plano de implementacao", "Ambiente preparado", "Prompt original da planilha"],
  [10, "L8_TEST_FOUNDATION", "Testes", "Sprint 0 detectou ausencia de testes", "Condicional forte", "Stack detectada", "SPRINT_00B_TESTES.md + test-plan.md", "docs/implementation/SPRINT_00B_TESTES.md"],
  [11, "SPLIT_SPRINT", "Planejamento", "Sprint grande demais", "Condicional", "Sprint grande", "Tarefas menores", "Prompt original da planilha"],
  [12, "CODER_ECONOMICO", "Execucao", "Toda tarefa de implementacao", "Obrigatorio na execucao", "Tarefa + PRD + plano", "Codigo alterado + evidencias", "Prompt original + docs/agent/CODER_GUARDRAILS.md"],
  [13, "AUDIT_EVIDENCE", "Auditoria", "Antes de auditar", "Obrigatorio", "Mudancas implementadas", "AUDIT_EVIDENCE.md", "Prompt original da planilha"],
  [14, "AUDIT_FINAL_COMMON", "Auditoria", "Projeto comum apos evidencias", "Obrigatorio por ciclo", "Codigo + evidencias", "final-audit.md", "Prompt original da planilha"],
  [15, "AUDIT_FINAL_UIUX", "Auditoria UI/UX", "Projeto UI/UX apos evidencias", "Obrigatorio em UI/UX", "Codigo + evidencias + screenshots", "final-audit.md", "Prompt original da planilha"],
  [16, "POST_AUDIT_FIX", "Correcao", "Auditoria encontrou problemas", "Condicional", "final-audit.md", "audit-fixes.md", "Prompt original da planilha"],
  [17, "POST_FIX_VALIDATION", "Validacao", "Correcoes concluidas", "Obrigatorio se houve correcao", "audit-fixes.md", "validation-report.md", "Prompt original da planilha"],
  [18, "L5_RETROSPECTIVE", "Evolucao", "Validacao pos-correcao aprovada", "Recomendado ao fim de ciclo", "PRD + auditoria + changelog", "retrospective-vN.md", "docs/evolution/RETROSPECTIVE_PROMPT.md"],
  [19, "OUT_OF_SCOPE", "Evolucao", "Surgiu melhoria fora do escopo", "Condicional", "Sugestao ou achado", "out-of-scope-changes.md", "Prompt original da planilha"],
  [20, "PRD_V1_1", "Evolucao", "Mudancas aprovadas para proximo ciclo", "Condicional", "Retrospectiva + backlog", "PRD_v1.1.md", "Prompt original da planilha"],
  [21, "L2_ROLLBACK", "Falha", "Sprint falhou ou gerou regressao", "Emergencial", "Falha + arquivos alterados", "Estado revertido + registros", "docs/agent/ROLLBACK_PROTOCOL.md"],
  [22, "L7_UI_COMPONENTS", "Design", "Tela/componente UI aprovado em auditoria", "Condicional UI/UX", "Auditoria aprovada", "Secao 16 do UI_UX_GUIDE.md", "docs/design/UI_UX_GUIDE_SECTION_16.md"],
];

addSheet("Fluxo v1.1", [
  "Ordem",
  "ID",
  "Fase",
  "Quando usar",
  "Obrigatorio?",
  "Entrada",
  "Saida",
  "Arquivo Markdown",
], fluxoRows);

addSheet("Roteamento", [
  "Situacao identificada",
  "Proximo passo",
  "Observacao",
], [
  ["Nenhum arquivo existe + ideia inicial", "AGENT_RULES -> PRE_PRD", "Criar base operacional antes de planejar produto"],
  ["Projeto existente sem documentacao", "L6_BROWNFIELD", "Nao tratar como projeto novo"],
  ["Tem Pre-PRD, sem PRD", "PRD_MASTER", "Transformar escopo em especificacao"],
  ["Tem PRD, sem revisao", "PRD_REVIEW", "Nao planejar implementacao antes da revisao"],
  ["Tem PRD revisado, sem plano", "IMPLEMENTATION_PLAN", "Escolher comum ou UI/UX pela triagem"],
  ["Tem plano, sem Sprint 0", "SPRINT_0", "Preparar ambiente e validar stack"],
  ["Sprint 0 detectou ausencia de testes", "L8_TEST_FOUNDATION", "Configurar testes antes da Sprint 1"],
  ["Sprint grande demais", "SPLIT_SPRINT", "Quebrar antes de enviar ao coder economico"],
  ["Implementacao em andamento", "CODER_ECONOMICO + guardrails", "Usar limites operacionais"],
  ["Implementacao concluida", "AUDIT_EVIDENCE", "Gerar evidencias antes da auditoria"],
  ["Evidencias prontas", "AUDIT_FINAL_COMMON ou AUDIT_FINAL_UIUX", "Auditar com outro contexto"],
  ["Auditoria encontrou problemas", "POST_AUDIT_FIX", "Corrigir com outro contexto"],
  ["Correcao concluida", "POST_FIX_VALIDATION", "Validar com outro contexto"],
  ["Validacao aprovada", "L5_RETROSPECTIVE", "Fechar ciclo e aprender"],
  ["Sprint falhou ou regressao", "L2_ROLLBACK", "Reverter com rastreabilidade"],
  ["Sessao/modelo vai mudar", "HANDOFF + CURRENT_STATE", "Garantir continuidade"],
]);

addSheet("Arquivos", [
  "Arquivo",
  "Funcao",
  "Quando atualizar",
  "Obrigatorio?",
], [
  ["/docs/agent/agent-operating-rules.md", "Regras operacionais base", "Inicio do projeto e quando regra mudar", "Sim"],
  ["/docs/agent/TRIAGE.md", "Prompt de entrada e roteamento", "Quando o fluxo mudar", "Sim"],
  ["/docs/agent/CODER_GUARDRAILS.md", "Limites do coder economico", "Quando surgirem novos riscos", "Sim"],
  ["/docs/agent/ROLLBACK_PROTOCOL.md", "Protocolo de reversao segura", "Quando processo de rollback mudar", "Sim"],
  ["/docs/agent/HANDOFF.md", "Transferencia de contexto", "Antes de trocar sessao/modelo ou pausar", "Sim"],
  ["/docs/agent/CURRENT_STATE.md", "Estado atual do projeto", "Ao terminar tarefa ou encontrar erro novo", "Sim"],
  ["/docs/product/BROWNFIELD_ANALYSIS.md", "Diagnostico de projeto existente", "Quando projeto ja existe", "Condicional"],
  ["/docs/product/PRE_PRD_ESCOPO.md", "Escopo inicial estruturado", "Projeto novo ou estado desejado ausente", "Condicional"],
  ["/docs/product/PRD.md", "Especificacao mestre", "Antes do plano de implementacao", "Sim"],
  ["/docs/implementation/PLANO_IMPLEMENTACAO.md", "Plano de sprints", "Apos PRD aprovado", "Sim"],
  ["/docs/implementation/SPRINT_00B_TESTES.md", "Sprint de fundacao de testes", "Quando nao houver testes", "Condicional"],
  ["/docs/implementation/test-plan.md", "Como rodar e organizar testes", "Ao configurar ou mudar testes", "Condicional forte"],
  ["/docs/audit/final-audit.md", "Resultado de auditoria", "Apos cada ciclo auditado", "Sim"],
  ["/docs/audit/audit-fixes.md", "Correcoes feitas pos-auditoria", "Quando houver achados", "Condicional"],
  ["/docs/audit/validation-report.md", "Validacao das correcoes", "Apos correcoes", "Condicional"],
  ["/docs/design/UI_UX_GUIDE.md", "Guia visual", "Projetos UI/UX", "Condicional"],
  ["/docs/evolution/DECISIONS.md", "Decisoes permanentes", "Toda decisao tecnica/produto", "Sim"],
  ["/docs/evolution/CHANGELOG.md", "Mudancas implementadas", "Toda alteracao real", "Sim"],
  ["/docs/evolution/out-of-scope-changes.md", "Melhorias fora do escopo", "Quando aparecer sugestao futura", "Condicional"],
  ["/docs/evolution/retrospective-vN.md", "Aprendizados do ciclo", "Fim de ciclo", "Recomendado"],
]);

addSheet("Checklist", [
  "Etapa",
  "Tarefa",
  "Status sugerido",
  "Como saber que terminou",
], [
  ["Preparacao", "Criar/copiar pasta docs no projeto real", "Pendente", "Estrutura /docs existe"],
  ["Preparacao", "Copiar agent-operating-rules.md", "Pendente", "Arquivo existe e foi lido pelo agente"],
  ["Entrada", "Executar L1_TRIAGE", "Pendente", "Diagnostico com proximo prompt"],
  ["Produto", "Escolher Pre-PRD ou Brownfield", "Pendente", "Roteamento justificado"],
  ["Produto", "Criar/atualizar PRD", "Pendente", "PRD revisavel existe"],
  ["Produto", "Revisar criticamente PRD", "Pendente", "Revisao documentada"],
  ["Implementacao", "Criar plano de implementacao", "Pendente", "Sprints e criterios de aceite definidos"],
  ["Implementacao", "Executar Sprint 0", "Pendente", "Stack, comandos e ambiente verificados"],
  ["Testes", "Executar Sprint 00B se necessario", "Condicional", "Teste smoke passa"],
  ["Execucao", "Enviar tarefa ao coder com guardrails", "Pendente", "Declaracao de conclusao com evidencias"],
  ["Auditoria", "Gerar AUDIT_EVIDENCE.md", "Pendente", "Evidencias reunidas"],
  ["Auditoria", "Auditar em outro contexto", "Pendente", "final-audit.md gerado"],
  ["Correcao", "Corrigir achados", "Condicional", "audit-fixes.md gerado"],
  ["Validacao", "Validar correcoes em outro contexto", "Condicional", "validation-report.md aprovado"],
  ["Evolucao", "Fazer retrospectiva", "Recomendado", "retrospective-vN.md gerado"],
  ["Evolucao", "Atualizar backlog/PRD v1.1", "Condicional", "Mudancas futuras priorizadas"],
]);

addSheet("Indice Prompts", [
  "ID",
  "Nome",
  "Tipo",
  "Arquivo",
  "Uso recomendado",
], [
  ["L1_TRIAGE", "Triagem Inicial", "Prompt", "docs/agent/TRIAGE.md", "Primeiro prompt de qualquer sessao/projeto"],
  ["AGENT_RULES", "Regras Operacionais", "Documento base", "docs/agent/agent-operating-rules.md", "Referencia obrigatoria"],
  ["L2_ROLLBACK", "Rollback", "Protocolo", "docs/agent/ROLLBACK_PROTOCOL.md", "Quando sprint falha/regressao"],
  ["L3_CODER_GUARDRAILS", "Guardrails do Coder", "Secao de prompt", "docs/agent/CODER_GUARDRAILS.md", "Antes de enviar tarefa ao coder"],
  ["L4_CONFLICT_RULES", "Conflitos entre documentos", "Regra", "docs/agent/agent-operating-rules.md", "Quando docs contradizem"],
  ["L5_RETROSPECTIVE", "Retrospectiva", "Prompt", "docs/evolution/RETROSPECTIVE_PROMPT.md", "Fim de ciclo"],
  ["L6_BROWNFIELD", "Analise Brownfield", "Prompt", "docs/product/BROWNFIELD_ANALYSIS.md", "Projeto existente"],
  ["L7_UI_COMPONENTS", "Componentes aprovados", "Secao UI/UX", "docs/design/UI_UX_GUIDE_SECTION_16.md", "Depois de auditoria visual aprovada"],
  ["L8_TEST_FOUNDATION", "Sprint 00B Testes", "Sprint", "docs/implementation/SPRINT_00B_TESTES.md", "Quando nao ha testes"],
  ["HANDOFF_TEMPLATE", "Handoff", "Template", "docs/agent/HANDOFF_TEMPLATE.md", "Antes de troca de contexto"],
  ["CURRENT_STATE_TEMPLATE", "Estado Atual", "Template", "docs/agent/CURRENT_STATE_TEMPLATE.md", "Ao fechar tarefa ou erro"],
  ["FLUXO_V1_1", "Fluxo v1.1", "Referencia", "docs/implementation/FLUXO_V1.1.md", "Visao textual do fluxo"],
]);

addSheet("Decisoes", [
  "Decisao",
  "Motivo",
  "Impacto pratico",
], [
  ["Planilha como mapa, Markdown como fonte", "Evita planilha gigante e dificil de manter", "Excel orienta; arquivos .md guardam prompts completos"],
  ["Triagem antes de tudo", "Evita executar prompt errado", "Todo projeto comeca por diagnostico"],
  ["Brownfield como alternativa ao Pre-PRD", "Projeto existente nao deve ser tratado como ideia nova", "Primeiro documenta a realidade do codigo"],
  ["Sprint 00B antes da Sprint 1 quando nao ha testes", "Sem testes, auditoria fica subjetiva", "Cria smoke test e comando de teste"],
  ["Guardrails no coder economico", "Reduz risco de mudancas grandes demais", "Coder para em areas sensiveis"],
  ["Rollback documentado", "Falhas precisam ser rastreaveis", "Reversao com registro e verificacao"],
  ["Retrospectiva antes do novo ciclo", "Transforma auditoria em aprendizado", "Alimenta backlog e PRD v1.1"],
]);

await fs.mkdir(root, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
