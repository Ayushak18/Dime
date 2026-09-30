import prisma from "../lib/prisma.ts";

export async function getAllStocks() {
  const stocks = await prisma.stock.findMany();

  return stocks.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    price: stock.priceCents / 100,
  }));
}
