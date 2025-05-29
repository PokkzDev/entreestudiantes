const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding allowed email domains...');

  // Create initial allowed email domains
  const allowedDomains = [
    {
      domain: 'inacapmail.cl',
      description: 'Correos institucionales de estudiantes INACAP',
      isActive: true
    },
    {
      domain: 'inacap.cl',
      description: 'Correos institucionales de INACAP',
      isActive: true
    }
  ];

  for (const domainData of allowedDomains) {
    const existingDomain = await prisma.allowedEmailDomain.findUnique({
      where: { domain: domainData.domain }
    });

    if (!existingDomain) {
      await prisma.allowedEmailDomain.create({
        data: domainData
      });
      console.log(`✓ Created allowed domain: ${domainData.domain}`);
    } else {
      console.log(`- Domain already exists: ${domainData.domain}`);
    }
  }

  console.log('Seeding app configurations...');

  // Create initial app configurations
  const appConfigs = [
    {
      key: 'institutional_email_strict_mode',
      value: 'true',
      description: 'When enabled, only emails from allowed institutional domains can register. When disabled, all emails are allowed.',
      isActive: true
    },
    {
      key: 'institutional_email_enabled',
      value: 'true',
      description: 'Enable or disable institutional email checking entirely.',
      isActive: true
    },
    {
      key: 'registration_enabled',
      value: 'true',
      description: 'Enable or disable user registration.',
      isActive: true
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode to restrict access to the application.',
      isActive: true
    }
  ];

  for (const configData of appConfigs) {
    const existingConfig = await prisma.appConfig.findUnique({
      where: { key: configData.key }
    });

    if (!existingConfig) {
      await prisma.appConfig.create({
        data: configData
      });
      console.log(`✓ Created app config: ${configData.key} = ${configData.value}`);
    } else {
      console.log(`- App config already exists: ${configData.key}`);
    }
  }

  console.log('Seeding admin account...');

  // Create admin account
  const adminEmail = 'admin@entreestudiantes.cl';
  const adminPassword = '!*Colademono12';
  
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.admin.create({
      data: {
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        isActive: true,
        isSuper: true
      }
    });
    console.log(`✓ Created admin account: ${adminEmail}`);
  } else {
    console.log(`- Admin account already exists: ${adminEmail}`);
  }

  console.log('Seeding test users with different account tiers...');

  // Create test users with different tiers for demonstration
  const testUsers = [
    {
      username: 'usuario_basic',
      email: 'basic@inacapmail.cl',
      password: 'password123',
      name: 'Usuario Básico',
      accountTier: 'basic',
      tierStartDate: new Date(),
      tierEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subscriptionStatus: 'active',
      isVerified: true
    },
    {
      username: 'usuario_premium',
      email: 'premium@inacapmail.cl',
      password: 'password123',
      name: 'Usuario Premium',
      accountTier: 'premium',
      tierStartDate: new Date(),
      tierEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subscriptionStatus: 'active',
      isVerified: true
    },
    {
      username: 'usuario_elite',
      email: 'elite@inacapmail.cl',
      password: 'password123',
      name: 'Usuario Elite',
      accountTier: 'elite',
      tierStartDate: new Date(),
      tierEndDate: null, // unlimited
      subscriptionStatus: 'active',
      isVerified: true
    }
  ];

  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
      console.log(`✓ Created test user: ${userData.email} (${userData.accountTier})`);
    } else {
      console.log(`- Test user already exists: ${userData.email}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 