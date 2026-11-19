# Finanças — Inteligência de Fluxo de Caixa

Dashboard de gestão financeira pessoal em **Next.js (App Router) + TypeScript + Tailwind CSS v4 + Lucide + Recharts**, com schema **Prisma/PostgreSQL** e seed.
O frontend já vem pré-populado com o cenário Out/26 → Jan/26 e salva tudo no `localStorage`, então funciona sem banco.

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
```

### Banco (opcional)

```bash
cp .env.example .env          # ajuste DATABASE_URL
npm run db:push               # cria as tabelas
npm run db:seed               # carrega o cenário inicial
```

## Funcionalidades

| Módulo | O que faz |
|---|---|
| **Filtro de período** | Out/26, Nov/26, Dez/26, Jan/26 ou **Consolidado**. Clicar numa barra do gráfico também filtra. |
| **KPIs** | Receita (com toggle da entrada extra de R$ 16k), Despesa (com variação mensal), Saldo líquido (verde/vermelho + caixa acumulado), Comprometimento com cartões/empréstimos (%, com limite de referência de 30%) e Custo real pessoal. |
| **Gráficos** | Receitas × despesas com linha de saldo acumulado; composição por grupo (donut) ou por categoria (barras). |
| **Tabela CRUD** | Edição inline (Enter confirma, Esc cancela), nova despesa/receita, filtro por grupo, busca, tag de terceiros, remoção. A entrada pontual pode ser alocada em qualquer mês. |
| **Otimizador de alocação** | Compara Manter em caixa × **Avalanche** × **Bola de Neve** × Foco Empréstimos × Foco Cartões. A projeção de 24 meses usa juros sobre saldo devedor e mostra a parcela liberada, o caixa livre no fim de Jan/26, o fôlego, os juros evitados e uma recomendação. Avisa quando o capital passa do caixa realmente disponível. |
| **Meu gasto × terceiros** | Separa o custo real pessoal do que só transita pela conta (Sr. Luiz, Andreia, Ana). Itens do grupo Terceiros ou com nomes como "Sr.", "mãe" etc. são marcados automaticamente. |
| **Simulador "E se…"** | Sliders de aumento de receita, corte nos cartões e corte nas fixas, além da opção de reembolso dos terceiros. Mostra antes → depois, quanto falta para equilibrar e um botão "quanto preciso ganhar". |
| **Alertas preditivos** | Score de saúde (0–100) e alertas: fixas + empréstimos acima da receita base, déficit estrutural, data em que o caixa zera, dependência da entrada extra, maior ralo de caixa, alívios e aumentos entre meses. |
| **Dados** | Exportar/importar JSON e resetar para os dados padrão. |

## Estrutura

```
app/
  layout.tsx            # fonte Inter, metadata, dark mode
  page.tsx              # página principal (orquestra os módulos)
  globals.css           # tokens de cor (Tailwind v4 @theme)
components/
  Header.tsx            # filtro de período + exportar/importar/resetar
  KpiCards.tsx
  MonthlyChart.tsx      # Recharts ComposedChart
  CompositionChart.tsx  # donut por grupo / barras por categoria
  AllocationOptimizer.tsx
  WhatIfSimulator.tsx
  InsightsPanel.tsx
  ThirdPartyPanel.tsx
  ExpenseTable.tsx
  IncomeTable.tsx
  ui/                   # Card, Badge, Button, Segmented, Slider, Toggle, MoneyInput, TextInput, ChartTooltip
hooks/
  useFinanceStore.ts    # useReducer + persistência em localStorage + import/export
lib/
  types.ts  constants.ts  format.ts  months.ts
  seed-data.ts          # dados iniciais (compartilhados com o seed do Prisma)
  initial-state.ts      # estado inicial + validação de importação
  finance.ts            # cálculos de receita, despesa, fluxo, fôlego e what-if
  optimizer.ts          # motor Avalanche × Bola de Neve
  insights.ts           # regras dos alertas + score de saúde
prisma/
  schema.prisma         # User, Period, Income, ExpenseCategory, ExpenseEntry, DebtProfile
  seed.ts
```

## Premissas

- O mês de referência para o simulador e o otimizador é o **último mês** da série (Jan/26), tratado como padrão recorrente.
- Saldos devedores e juros das dívidas são **estimativas editáveis** no otimizador: empréstimos ≈ 10 parcelas restantes e cartões ≈ 4 faturas parceladas. Ajuste com os dados reais dos contratos.
- O rótulo "Jan/26" foi mantido como na planilha original.
- As projeções são estimativas e não substituem orientação financeira profissional.
