import { PrismaClient } from "prisma/generated/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all data ...");

  // Delete in correct order to respect foreign keys
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();

  console.log("Start seeding ...");

  // Seed Categories and Items
  const categories = await prisma.category.createMany({
    data: [
      { name: "Appetizers" },
      { name: "Main Course" },
      { name: "Beverages" },
      { name: "Desserts" },
    ],
  });

  const appetizerCategory = await prisma.category.findUnique({
    where: { name: "Appetizers" },
  });

  const beverageCategory = await prisma.category.findUnique({
    where: { name: "Beverages" },
  });

  const items = await prisma.item.createMany({
    data: [
      {
        name: "Spring Rolls",
        price: 5.99,
        categoryId: appetizerCategory!.id,
      },
      {
        name: "Garlic Bread",
        price: 4.5,
        categoryId: appetizerCategory!.id,
      },
      {
        name: "Coke",
        price: 2.0,
        categoryId: beverageCategory!.id,
      },
      {
        name: "Lemonade",
        price: 2.5,
        categoryId: beverageCategory!.id,
      },
    ],
  });

  // Seed Tables
  const tables = await prisma.table.createMany({
    data: [
      { tableNumber: 1 },
      { tableNumber: 2 },
      { tableNumber: 3 },
      { tableNumber: 4 },
      { tableNumber: 5 },
    ],
  });

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
