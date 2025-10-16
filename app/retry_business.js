require('dotenv').config();
const { processStatement } = require('./lib/statement-processor.ts');

async function retryBusiness() {
  try {
    console.log('🔄 Retrying business statement processing...\n');
    await processStatement('cmgten4df00030sxio2pqoy1l');
    console.log('\n✅ Processing completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

retryBusiness();
