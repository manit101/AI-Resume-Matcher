const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mockUserId = 'mock-user-id';
  
  const existingUser = await prisma.user.findUnique({
    where: { id: mockUserId }
  });

  if (!existingUser) {
    console.log("Mock user not found. Creating it...");
    await prisma.user.create({
      data: {
        id: mockUserId,
        firebaseId: 'mock-firebase-id-123',
        email: 'mock@example.com',
        name: 'Mock User'
      }
    });
    console.log("Mock user created successfully!");
  } else {
    console.log("Mock user already exists.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
