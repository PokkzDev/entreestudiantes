const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  console.log('Seeding account tiers...');

  // Define account tiers - simplified to just Free and Premium
  const accountTiers = [
    {
      tierKey: 'free',
      name: 'Gratuito',
      publicationLimit: 3,
      price: 0,
      features: JSON.stringify([
        "Hasta 3 publicaciones registradas",
        "Funciones básicas",
        "Soporte comunitario"
      ]),
      icon: 'hand-holding-heart',
      color: '#64748b',
      bgColor: '#f8fafc',
      isActive: true,
      sortOrder: 1
    },
    {
      tierKey: 'premium',
      name: 'Premium',
      publicationLimit: 10,
      price: 2990,
      features: JSON.stringify([
        "Hasta 10 publicaciones",
        "Estadísticas Básicas",
        "Funciones premium",
        "Soporte via Email",

        
      ]),
      icon: 'gem',
      color: '#7c3aed',
      bgColor: '#f3e8ff',
      isActive: true,
      sortOrder: 2
    }
  ];

  // Create account tiers
  for (const tierData of accountTiers) {
    const existingTier = await prisma.accountTier.findUnique({
      where: { tierKey: tierData.tierKey }
    });

    if (!existingTier) {
      await prisma.accountTier.create({
        data: tierData
      });
      console.log(`✓ Created account tier: ${tierData.name} (${tierData.tierKey}) - $${tierData.price}`);
    } else {
      // Update existing tier to ensure consistency
      await prisma.accountTier.update({
        where: { tierKey: tierData.tierKey },
        data: {
          name: tierData.name,
          publicationLimit: tierData.publicationLimit,
          price: tierData.price,
          features: tierData.features,
          icon: tierData.icon,
          color: tierData.color,
          bgColor: tierData.bgColor,
          isActive: tierData.isActive,
          sortOrder: tierData.sortOrder
        }
      });
      console.log(`✓ Updated account tier: ${tierData.name} (${tierData.tierKey})`);
    }
  }

  console.log('Seeding allowed email domains...');

  // Define allowed email domains
  const allowedDomains = [
    {
      domain: 'inacapmail.cl',
      description: 'INACAP institutional email domain'
    },
    {
      domain: 'inacap.cl',
      description: 'INACAP institutional email domain (alternative)'
    }
  ];

  // Create allowed email domains
  for (const domainData of allowedDomains) {
    const existingDomain = await prisma.allowedEmailDomain.findUnique({
      where: { domain: domainData.domain }
    });

    if (!existingDomain) {
      await prisma.allowedEmailDomain.create({
        data: domainData
      });
      console.log(`✓ Created allowed email domain: ${domainData.domain}`);
    } else {
      console.log(`- Email domain already exists: ${domainData.domain}`);
    }
  }

  console.log('Seeding user accounts...');

  // Create the specific user account as requested: Luis Contreras
  const luisContrerasUser = {
    username: 'PokkzDev',
    email: 'admin@entreestudiantes.cl',
    password: '!*Colademono12',
    name: 'Luis Contreras',
    rut: '18808398-6',
    university: 'INACAP',
    campus: 'Sede Chillán',
    isVerified: true,
    isActive: true,
    // Set account tier to free (using the simplified model)
    accountTier: 'free'
  };

  const existingLuisUser = await prisma.user.findUnique({
    where: { email: luisContrerasUser.email }
  });

  let luisUserId;

  if (!existingLuisUser) {
    const hashedPassword = await bcrypt.hash(luisContrerasUser.password, 10);
    
    const createdUser = await prisma.user.create({
      data: {
        ...luisContrerasUser,
        password: hashedPassword
      }
    });
    luisUserId = createdUser.id;
    console.log(`✓ Created user: ${luisContrerasUser.email} (${luisContrerasUser.name}) - RUT: ${luisContrerasUser.rut}`);
    console.log(`✓ Account set to FREE tier with 3 publication limit`);
  } else {
    // Update existing user to ensure they have the correct account tier
    await prisma.user.update({
      where: { email: luisContrerasUser.email },
      data: {
        accountTier: 'free'
      }
    });
    luisUserId = existingLuisUser.id;
    console.log(`- User already exists: ${luisContrerasUser.email}`);
    console.log(`✓ Updated user account tier to FREE`);
  }

  console.log('Seeding app configuration...');

  // Seed app configuration for plan purchasing
  const configItems = [
    {
      key: 'plan_purchasing_enabled',
      value: 'true',
      description: 'Enable or disable plan purchasing functionality',
      isActive: true
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode to disable certain features',
      isActive: true
    }
  ];

  for (const config of configItems) {
    const existingConfig = await prisma.appConfig.findUnique({
      where: { key: config.key }
    });

    if (!existingConfig) {
      await prisma.appConfig.create({
        data: config
      });
      console.log(`✓ Created app config: ${config.key} = ${config.value}`);
    } else {
      console.log(`- App config already exists: ${config.key}`);
    }
  }

}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
