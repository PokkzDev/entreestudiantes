const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  console.log('Seeding user accounts...');

  // Create the specific user account as requested: Luis Contreras
  const luisContrerasUser = {
    username: 'PokkzDev',
    email: 'luis.contreras69@inacapmail.cl',
    password: '!*Colademono12',
    name: 'Luis Contreras',
    rut: '18808398-6',
    university: 'INACAP',
    campus: 'Sede Chillán',
    isVerified: true,
    isActive: true
  };

  const existingLuisUser = await prisma.user.findUnique({
    where: { email: luisContrerasUser.email }
  });

  if (!existingLuisUser) {
    const hashedPassword = await bcrypt.hash(luisContrerasUser.password, 10);
    
    await prisma.user.create({
      data: {
        ...luisContrerasUser,
        password: hashedPassword
      }
    });
    console.log(`✓ Created user: ${luisContrerasUser.email} (${luisContrerasUser.name}) - RUT: ${luisContrerasUser.rut}`);
  } else {
    console.log(`- User already exists: ${luisContrerasUser.email}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
