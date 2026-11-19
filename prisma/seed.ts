import { PrismaClient, type Period } from "@prisma/client";
import { SEED_DEBTS, SEED_EXPENSES, SEED_INCOMES, SEED_MONTHS } from "../lib/seed-data";

const prisma = new PrismaClient();

const GROUP_MAP = {
  cartoes: "CARTOES",
  emprestimos: "EMPRESTIMOS",
  moradia: "MORADIA_FIXAS",
  terceiros: "TERCEIROS",
} as const;

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@financas.local" },
    update: {},
    create: { name: "Usuário Demo", email: "demo@financas.local" },
  });

  // Recomeça do zero para o usuário demo (seed idempotente)
  await prisma.income.deleteMany({ where: { userId: user.id } });
  await prisma.expenseCategory.deleteMany({ where: { userId: user.id } });
  await prisma.period.deleteMany({ where: { userId: user.id } });

  const periods: Period[] = [];
  for (const [order, m] of SEED_MONTHS.entries()) {
    periods.push(
      await prisma.period.create({
        data: { userId: user.id, label: m.label, year: m.year, month: m.month, order },
      }),
    );
  }

  for (const inc of SEED_INCOMES) {
    await prisma.income.create({
      data: {
        userId: user.id,
        name: inc.name,
        type: inc.type === "pontual" ? "PONTUAL" : "RECORRENTE",
        amount: inc.amount,
        allocatedPeriodId: inc.type === "pontual" ? periods[inc.month ?? 0].id : null,
      },
    });
  }

  for (const [sortOrder, exp] of SEED_EXPENSES.entries()) {
    const debt = SEED_DEBTS[exp.name];
    await prisma.expenseCategory.create({
      data: {
        userId: user.id,
        name: exp.name,
        group: GROUP_MAP[exp.group],
        isThirdParty: exp.thirdParty ?? false,
        sortOrder,
        entries: {
          create: exp.values.map((amount, i) => ({ periodId: periods[i].id, amount })),
        },
        debt: debt
          ? { create: { outstandingBalance: debt.balance, monthlyRatePct: debt.ratePct } }
          : undefined,
      },
    });
  }

  console.log(`Seed concluído: ${periods.length} meses, ${SEED_INCOMES.length} receitas, ${SEED_EXPENSES.length} despesas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
