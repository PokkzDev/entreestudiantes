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
    isActive: true,
    // Set account to free plan explicitly (only using existing database fields)
    accountTier: 'free',
    tierStartDate: new Date(),
    tierEndDate: null,
    subscriptionStatus: 'active'
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
    console.log(`✓ Account set to FREE plan with 3 publication limit`);
  } else {
    // Update existing user to ensure they have free plan (only using existing database fields)
    await prisma.user.update({
      where: { email: luisContrerasUser.email },
      data: {
        accountTier: 'free',
        tierStartDate: new Date(),
        tierEndDate: null,
        subscriptionStatus: 'active'
      }
    });
    console.log(`- User already exists: ${luisContrerasUser.email}`);
    console.log(`✓ Updated user to FREE plan with 3 publication limit`);
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
