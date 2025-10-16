require('dotenv').config();

const pendingStatementIds = [
  'cmgl22ak00001kz08d9ebb3em', // Personal Statement
  'cmgl14y380001vrky2tnmm3do'  // Business Statement
];

async function triggerProcessing() {
  for (const id of pendingStatementIds) {
    console.log(`\n🔄 Triggering processing for statement: ${id}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/bank-statements/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statementId: id })
      });

      const data = await response.json();
      console.log('Response:', data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

triggerProcessing();
