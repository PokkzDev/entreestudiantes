// Script to view contact messages from the database
// Run with: node view_contact_messages.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function viewContactMessages() {
  try {
    console.log('📧 Fetching contact messages...\n');
    
    // Get all feedback entries that are contact messages
    const contactMessages = await prisma.feedback.findMany({
      where: {
        type: {
          startsWith: 'contact_'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (contactMessages.length === 0) {
      console.log('📭 No contact messages found.');
      return;
    }

    console.log(`📬 Found ${contactMessages.length} contact message(s):\n`);
    console.log('=' * 80);

    contactMessages.forEach((message, index) => {
      console.log(`\n📧 Contact Message #${index + 1}`);
      console.log('─'.repeat(50));
      console.log(`📅 Date: ${message.createdAt.toLocaleString('es-ES')}`);
      console.log(`🏷️  Type: ${message.type.replace('contact_', '').toUpperCase()}`);
      console.log(`📋 Subject: ${message.subject}`);
      console.log(`📊 Priority: ${message.priority}`);
      console.log(`📫 Status: ${message.status}`);
      
      if (message.user) {
        console.log(`👤 User: ${message.user.name || message.user.username || 'N/A'} (${message.user.email})`);
      } else {
        console.log(`📧 Email: ${message.email || 'No email provided'}`);
      }
      
      console.log(`💬 Message:\n${message.message}`);
      console.log(`🌐 IP: ${message.ipAddress}`);
      console.log('─'.repeat(50));
    });

    // Show summary by type
    console.log('\n📊 Summary by Type:');
    const typeCounts = contactMessages.reduce((acc, msg) => {
      const type = msg.type.replace('contact_', '');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type.toUpperCase()}: ${count} message(s)`);
    });

    // Show priority summary
    console.log('\n🚨 Priority Summary:');
    const priorityCounts = contactMessages.reduce((acc, msg) => {
      acc[msg.priority] = (acc[msg.priority] || 0) + 1;
      return acc;
    }, {});

    Object.entries(priorityCounts).forEach(([priority, count]) => {
      console.log(`   ${priority.toUpperCase()}: ${count} message(s)`);
    });

  } catch (error) {
    console.error('❌ Error fetching contact messages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
viewContactMessages(); 