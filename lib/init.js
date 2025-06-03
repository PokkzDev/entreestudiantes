// Application initialization utilities

/**
 * Initialize application caches and data
 * Call this during app startup for better performance
 */
export async function initializeApp() {
  console.log('🚀 Initializing application...');
  
  try {
    // Account tiers are now loaded on-demand through the API
    // No need for server-side cache warmup
    
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Error during application initialization:', error);
    throw error;
  }
}

export default initializeApp; 