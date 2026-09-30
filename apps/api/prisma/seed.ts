import prisma from "../src/lib/prisma.ts";

const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", priceCents: 22752 },
  { symbol: "MSFT", name: "Microsoft Corporation", priceCents: 51114 },
  { symbol: "GOOGL", name: "Alphabet Inc.", priceCents: 16832 },
];

async function main() {
  for (const stock of stocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: stock,
      create: stock,
    });
  }
  console.log(`Seeded ${stocks.length} stocks`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
