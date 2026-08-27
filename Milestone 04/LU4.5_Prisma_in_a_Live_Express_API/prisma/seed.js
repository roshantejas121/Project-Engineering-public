const prisma = require('../src/lib/db');

async function main() {
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
    },
  });

  const products = await Promise.all([
    { name: 'Mechanical Keyboard', price: 89.99, stock: 5 },
    { name: 'Wireless Mouse', price: 39.99, stock: 10 },
    { name: 'USB-C Hub', price: 49.99, stock: 3 },
  ].map((data) => prisma.product.create({ data })));

  console.log(`Seeded user ${user.id} and ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
