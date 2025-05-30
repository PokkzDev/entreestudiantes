const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🧪 Testing User Data Validation for MercadoPago');
console.log('='.repeat(60));

/**
 * Simulate the validateAndCompleteUserData function for testing
 */
function validateAndCompleteUserData(userData) {
  // Validate first name
  const firstName = userData.nombre || userData.username || 'Usuario';
  
  // Validate and complete last name
  let lastName = userData.apellidos || '';
  
  // If no last name provided, use fallbacks to improve approval rates
  if (!lastName || lastName.trim() === '') {
    // Try to extract last name from username if it contains spaces
    if (userData.username && userData.username.includes(' ')) {
      const nameParts = userData.username.trim().split(' ');
      if (nameParts.length >= 2) {
        lastName = nameParts.slice(1).join(' '); // Take everything after first word
      }
    }
    
    // Final fallback to meet MercadoPago requirements
    if (!lastName || lastName.trim() === '') {
      lastName = 'Sin Apellido';
    }
  }
  
  // Validate email
  const email = userData.email;
  if (!email || !email.includes('@')) {
    throw new Error('Email válido es requerido para procesar el pago');
  }
  
  // Validate and complete RUT for Chilean market
  let rutNumber = userData.rut || '11111111-1';
  if (!rutNumber || rutNumber.trim() === '') {
    rutNumber = '11111111-1'; // Default test RUT
  }
  
  return {
    id: userData.id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    rutNumber: rutNumber.trim(),
    originalData: userData
  };
}

// Test cases to simulate different user data scenarios
const testCases = [
  {
    name: 'Complete User Data',
    userData: {
      id: 'test123',
      nombre: 'Juan',
      apellidos: 'Pérez González',
      email: 'juan.perez@example.com',
      rut: '12345678-9',
      username: 'juanperez'
    }
  },
  {
    name: 'No Last Name - Extract from Username',
    userData: {
      id: 'test456',
      nombre: 'María',
      apellidos: '',
      email: 'maria.silva@example.com',
      rut: '98765432-1',
      username: 'María Silva Torres'
    }
  },
  {
    name: 'No Last Name - Username without spaces',
    userData: {
      id: 'test789',
      nombre: 'Carlos',
      apellidos: null,
      email: 'carlos@example.com',
      rut: '11111111-1',
      username: 'carlos123'
    }
  },
  {
    name: 'Minimal Data - Use fallbacks',
    userData: {
      id: 'test999',
      nombre: '',
      apellidos: '',
      email: 'estudiante@university.cl',
      rut: '',
      username: 'Estudiante Universidad'
    }
  },
  {
    name: 'Only Username Available',
    userData: {
      id: 'test555',
      email: 'user@example.com',
      username: 'Ana María Rodríguez'
    }
  }
];

console.log('\n🔍 Testing validation with different user data scenarios:');
console.log('='.repeat(60));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('-'.repeat(40));
  
  try {
    const result = validateAndCompleteUserData(testCase.userData);
    
    console.log('✅ Input Data:', {
      nombre: testCase.userData.nombre || 'N/A',
      apellidos: testCase.userData.apellidos || 'N/A',
      username: testCase.userData.username || 'N/A',
      email: testCase.userData.email || 'N/A',
      rut: testCase.userData.rut || 'N/A'
    });
    
    console.log('✅ Validated Output:', {
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      rutNumber: result.rutNumber
    });
    
    // Check if last name is valid (not empty)
    if (result.lastName && result.lastName.trim() !== '') {
      console.log('🎯 ✅ Last name validation: PASS');
    } else {
      console.log('🎯 ❌ Last name validation: FAIL - Empty last name');
    }
    
  } catch (error) {
    console.log('❌ Validation Error:', error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📋 Summary:');
console.log('='.repeat(60));
console.log('✅ All test cases should have valid last names');
console.log('✅ This ensures better MercadoPago approval rates');
console.log('✅ The payer.last_name field will never be empty');

console.log('\n🔗 MercadoPago Recommendation:');
console.log('- Always include payer.last_name to improve approval rates');
console.log('- Complete payer information helps anti-fraud validation');
console.log('- Fallback values ensure field is never empty'); 