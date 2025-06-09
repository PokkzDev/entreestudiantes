const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// Configuration - adjust these numbers as needed
const CONFIG = {
  USERS_TO_CREATE: 200,
  PUBLICATIONS_TO_CREATE: 300,
  BATCH_SIZE: 50, // Process in batches to avoid memory issues
};

// Only INACAP with Sede Chillán
const UNIVERSITIES_AND_CAMPUSES = [
  {
    university: 'INACAP',
    campuses: ['Sede Chillán']
  }
];

// Publication categories and types
const PUBLICATION_CATEGORIES = [
  'Libros y Apuntes',
  'Tecnología',
  'Vehículos',
  'Hogar y Jardín',
  'Deportes',
  'Ropa y Accesorios',
  'Servicios',
  'Otros'
];

const PUBLICATION_TYPES = ['producto', 'servicio'];

const CONTACT_METHODS = ['whatsapp', 'email', 'telefono', 'instagram'];

// Helper function to generate Chilean RUT
function generateChileanRUT() {
  const number = faker.number.int({ min: 5000000, max: 25000000 });
  const digits = number.toString().split('').map(Number);
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = remainder < 2 ? remainder : 11 - remainder;
  const dvString = dv === 10 ? 'K' : dv.toString();
  
  return `${number}-${dvString}`;
}

// Helper function to generate university email
function generateUniversityEmail(firstName, lastName, university) {
  const domains = {
    'INACAP': ['inacapmail.cl', 'inacap.cl']
  };
  
  const universityDomains = domains[university] || ['inacapmail.cl'];
  const domain = faker.helpers.arrayElement(universityDomains);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.number.int({ min: 1, max: 999 })}`;
  
  return `${username}@${domain}`;
}

// Helper function to generate publication title and description
function generatePublicationContent(category, type) {
  const productTemplates = {
    'Libros y Apuntes': {
      titles: ['Libro de {subject}', 'Apuntes de {subject}', 'Manual de {subject}', 'Guía de {subject}'],
      subjects: ['Matemáticas', 'Física', 'Química', 'Historia', 'Literatura', 'Inglés', 'Programación', 'Economía']
    },
    'Tecnología': {
      titles: ['Laptop {brand}', 'Smartphone {brand}', 'Tablet {brand}', 'Audífonos {brand}', 'Mouse {brand}'],
      brands: ['Samsung', 'Apple', 'HP', 'Lenovo', 'Dell', 'Sony', 'LG']
    },
    'Vehículos': {
      titles: ['Auto {brand} {year}', 'Moto {brand}', 'Bicicleta {brand}'],
      brands: ['Toyota', 'Honda', 'Chevrolet', 'Nissan', 'Hyundai', 'Ford']
    },
    'Hogar y Jardín': {
      titles: ['Muebles para {room}', 'Decoración {room}', 'Plantas para {room}'],
      rooms: ['sala', 'dormitorio', 'cocina', 'baño', 'jardín']
    },
    'Deportes': {
      titles: ['Equipo de {sport}', 'Ropa deportiva {sport}', 'Accesorios {sport}'],
      sports: ['fútbol', 'básquetbol', 'tenis', 'natación', 'running', 'gimnasio']
    },
    'Ropa y Accesorios': {
      titles: ['Ropa {type}', 'Zapatos {type}', 'Accesorios {type}'],
      types: ['casual', 'formal', 'deportiva', 'de invierno', 'de verano']
    },
    'Otros': {
      titles: ['Artículo {adjective}', 'Producto {adjective}', 'Item {adjective}'],
      adjectives: ['único', 'especial', 'útil', 'práctico', 'innovador']
    }
  };

  const serviceTemplates = {
    'Servicios': {
      titles: ['Servicio de {service}', 'Clases de {service}', 'Asesoría en {service}', 'Ayuda con {service}'],
      services: ['tutorías', 'traducción', 'diseño', 'programación', 'fotografía', 'limpieza']
    },
    'Educación': {
      titles: ['Clases de {subject}', 'Apoyo en {subject}', 'Reforzamiento {subject}'],
      subjects: ['Matemáticas', 'Física', 'Química', 'Historia', 'Literatura', 'Inglés', 'Programación']
    },
    'Tecnología': {
      titles: ['Reparación de {tech}', 'Desarrollo de {tech}', 'Soporte técnico {tech}'],
      techs: ['computadores', 'smartphones', 'páginas web', 'aplicaciones', 'sistemas']
    },
    'Otros': {
      titles: ['Servicio de {service}', 'Apoyo en {service}'],
      services: ['diseño gráfico', 'edición de video', 'consultoría', 'coaching']
    }
  };

  let template, titleTemplate, replacement, title;

  if (type === 'producto') {
    // For productos, use product templates
    const availableCategories = Object.keys(productTemplates);
    const selectedCategory = availableCategories.includes(category) ? category : 'Otros';
    template = productTemplates[selectedCategory];
  } else {
    // For servicios, use service templates  
    const availableCategories = Object.keys(serviceTemplates);
    const selectedCategory = availableCategories.includes(category) ? category : 'Otros';
    template = serviceTemplates[selectedCategory];
  }

  titleTemplate = faker.helpers.arrayElement(template.titles);
  const replacementKey = Object.keys(template).find(key => key !== 'titles');
  replacement = faker.helpers.arrayElement(template[replacementKey]);
  title = titleTemplate.replace(`{${replacementKey.slice(0, -1)}}`, replacement);
  
  const descriptions = type === 'producto' ? [
    `Excelente ${title.toLowerCase()} en muy buen estado. Ideal para estudiantes.`,
    `${title} usado pero en perfectas condiciones. Precio negociable.`,
    `Vendo ${title.toLowerCase()} por cambio de carrera. Muy bien cuidado.`,
    `${title} en excelente estado, casi nuevo. Entrega inmediata.`,
    `Se vende ${title.toLowerCase()}. Contactar para más detalles y fotos adicionales.`
  ] : [
    `Ofrezco ${title.toLowerCase()} con experiencia comprobada. Tarifas accesibles para estudiantes.`,
    `${title} personalizado según tus necesidades. Horarios flexibles.`,
    `Brindo ${title.toLowerCase()} con metodología práctica y efectiva.`,
    `${title} de calidad a precios estudiantiles. Contactar para coordinar.`,
    `Se ofrece ${title.toLowerCase()}. Consulta sin compromiso.`
  ];

  return {
    title,
    description: faker.helpers.arrayElement(descriptions)
  };
}

async function createBulkUsers() {
  console.log(`\n🚀 Creating ${CONFIG.USERS_TO_CREATE} users in batches of ${CONFIG.BATCH_SIZE}...`);
  
  const users = [];
  const batches = Math.ceil(CONFIG.USERS_TO_CREATE / CONFIG.BATCH_SIZE);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchUsers = [];
    const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.USERS_TO_CREATE - batch * CONFIG.BATCH_SIZE);
    
    for (let i = 0; i < batchSize; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const universityData = faker.helpers.arrayElement(UNIVERSITIES_AND_CAMPUSES);
      const university = universityData.university;
      const campus = faker.helpers.arrayElement(universityData.campuses);
      
      const user = {
        username: faker.internet.username({ firstName, lastName }).toLowerCase(),
        name: `${firstName} ${lastName}`,
        email: generateUniversityEmail(firstName, lastName, university),
        password: await bcrypt.hash('password123', 10), // Simple password for testing
        university,
        campus,
        rut: generateChileanRUT(),
        bio: faker.lorem.sentence(),
        isVerified: faker.datatype.boolean({ probability: 0.8 }), // 80% verified
        isActive: true,
        accountTier: faker.helpers.weightedArrayElement([
          { weight: 0.8, value: 'free' },
          { weight: 0.2, value: 'premium' }
        ]),
        createdAt: faker.date.between({ 
          from: new Date('2023-01-01'), 
          to: new Date() 
        }),
        lastActivityAt: faker.date.recent({ days: 30 })
      };
      
      batchUsers.push(user);
    }
    
    try {
      const createdUsers = await prisma.user.createMany({
        data: batchUsers,
        skipDuplicates: true
      });
      
      console.log(`✅ Batch ${batch + 1}/${batches}: Created ${createdUsers.count} users`);
      users.push(...batchUsers);
    } catch (error) {
      console.error(`❌ Error in batch ${batch + 1}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully created ${users.length} users total`);
  return users;
}

async function createBulkPublications() {
  console.log(`\n📝 Creating ${CONFIG.PUBLICATIONS_TO_CREATE} publications in batches of ${CONFIG.BATCH_SIZE}...`);
  
  // Get all user IDs to assign publications to
  const users = await prisma.user.findMany({ select: { id: true } });
  
  if (users.length === 0) {
    console.log('❌ No users found. Please run user creation first.');
    return;
  }
  
  const publications = [];
  const batches = Math.ceil(CONFIG.PUBLICATIONS_TO_CREATE / CONFIG.BATCH_SIZE);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPublications = [];
    const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.PUBLICATIONS_TO_CREATE - batch * CONFIG.BATCH_SIZE);
    
    for (let i = 0; i < batchSize; i++) {
      const category = faker.helpers.arrayElement(PUBLICATION_CATEGORIES);
      const type = faker.helpers.arrayElement(PUBLICATION_TYPES);
      const contactMethod = faker.helpers.arrayElement(CONTACT_METHODS);
      const { title, description } = generatePublicationContent(category, type);
      
      const publication = {
        title,
        description,
        type,
        category,
        price: type === 'producto' ? faker.number.int({ min: 1000, max: 500000 }) : 
               (type === 'servicio' && faker.datatype.boolean({ probability: 0.7 })) ? 
               faker.number.int({ min: 5000, max: 50000 }) : null,
        images: JSON.stringify([
          faker.image.url({ width: 400, height: 300 }),
          faker.image.url({ width: 400, height: 300 })
        ]),
        contactMethod,
        contactInfo: contactMethod === 'whatsapp' ? '+569' + faker.number.int({ min: 10000000, max: 99999999 }) :
                    contactMethod === 'email' ? faker.internet.email() :
                    contactMethod === 'telefono' ? '+569' + faker.number.int({ min: 10000000, max: 99999999 }) :
                    '@' + faker.internet.username(),
        location: 'Chillán',
        university: 'INACAP',
        campus: 'Sede Chillán',
        tags: faker.helpers.arrayElements([
          'estudiante', 'universidad', 'barato', 'negociable', 'urgente', 
          'nuevo', 'usado', 'buen estado', 'oportunidad', 'descuento', 'inacap', 'chillan'
        ], { min: 2, max: 5 }).join(','),
        views: faker.number.int({ min: 0, max: 1000 }),
        featured: faker.datatype.boolean({ probability: 0.1 }), // 10% featured
        status: faker.helpers.weightedArrayElement([
          { weight: 0.85, value: 'activo' },
          { weight: 0.1, value: 'pausado' },
          { weight: 0.05, value: 'vendido' }
        ]),
        authorId: faker.helpers.arrayElement(users).id,
        createdAt: faker.date.between({ 
          from: new Date('2023-01-01'), 
          to: new Date() 
        })
      };
      
      batchPublications.push(publication);
    }
    
    try {
      const createdPublications = await prisma.publicacion.createMany({
        data: batchPublications,
        skipDuplicates: true
      });
      
      console.log(`✅ Batch ${batch + 1}/${batches}: Created ${createdPublications.count} publications`);
      publications.push(...batchPublications);
    } catch (error) {
      console.error(`❌ Error in batch ${batch + 1}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully created ${publications.length} publications total`);
  return publications;
}

async function createBulkFavorites() {
  console.log('\n❤️ Creating random favorites...');
  
  const users = await prisma.user.findMany({ select: { id: true } });
  const publications = await prisma.publicacion.findMany({ select: { id: true } });
  
  if (users.length === 0 || publications.length === 0) {
    console.log('❌ No users or publications found for favorites creation.');
    return;
  }
  
  const favorites = [];
  const favoritesToCreate = Math.min(800, users.length * 4); // Average 4 favorites per user
  
  for (let i = 0; i < favoritesToCreate; i++) {
    const userId = faker.helpers.arrayElement(users).id;
    const publicacionId = faker.helpers.arrayElement(publications).id;
    
    // Avoid duplicates
    const favoriteKey = `${userId}-${publicacionId}`;
    if (!favorites.some(f => `${f.userId}-${f.publicacionId}` === favoriteKey)) {
      favorites.push({
        userId,
        publicacionId,
        createdAt: faker.date.recent({ days: 90 })
      });
    }
  }
  
  try {
    const createdFavorites = await prisma.favorite.createMany({
      data: favorites,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${createdFavorites.count} favorites`);
  } catch (error) {
    console.error('❌ Error creating favorites:', error.message);
  }
}

async function main() {
  console.log('🌱 Starting bulk database seeding...');
  console.log(`📊 Configuration:`);
  console.log(`   - Users to create: ${CONFIG.USERS_TO_CREATE}`);
  console.log(`   - Publications to create: ${CONFIG.PUBLICATIONS_TO_CREATE}`);
  console.log(`   - Batch size: ${CONFIG.BATCH_SIZE}`);
  
  const startTime = Date.now();
  
  try {
    // Create users first
    await createBulkUsers();
    
    // Create publications
    await createBulkPublications();
    
    // Create some favorites
    await createBulkFavorites();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n🎉 Bulk seeding completed successfully!`);
    console.log(`⏱️ Total time: ${duration.toFixed(2)} seconds`);
    
    // Show final statistics
    const userCount = await prisma.user.count();
    const publicationCount = await prisma.publicacion.count();
    const favoriteCount = await prisma.favorite.count();
    
    console.log(`\n📈 Final Statistics:`);
    console.log(`   - Total users: ${userCount}`);
    console.log(`   - Total publications: ${publicationCount}`);
    console.log(`   - Total favorites: ${favoriteCount}`);
    
  } catch (error) {
    console.error('❌ Error during bulk seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during bulk seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 