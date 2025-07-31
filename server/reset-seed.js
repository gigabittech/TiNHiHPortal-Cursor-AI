const { execSync } = require('child_process');

async function resetDatabase() {
  console.log('Resetting database with new US-focused patient data...');
  
  try {
    // Drop and recreate tables to clear all data
    execSync('npm run db:push', { cwd: '/home/runner/workspace', stdio: 'inherit' });
    
    // The existing admin user and practitioner will be recreated through the normal flow
    console.log('Database reset complete. New US patient data will be created on next server start.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

resetDatabase();