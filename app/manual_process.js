require('dotenv').config();

// We'll use tsx to run the TypeScript file directly
const { spawn } = require('child_process');

const statementIds = [
  'cmgl22ak00001kz08d9ebb3em', // Personal Statement
  'cmgl14y380001vrky2tnmm3do'  // Business Statement
];

console.log('🔄 Manually triggering PDF processing...\n');

// Create a simple TypeScript script that will process the statements
const script = `
import { processStatement } from './lib/statement-processor';

const statementIds = ${JSON.stringify(statementIds)};

async function process() {
  for (const id of statementIds) {
    console.log('\\nProcessing statement:', id);
    try {
      await processStatement(id);
      console.log('✅ Completed:', id);
    } catch (error) {
      console.error('❌ Failed:', id, error.message);
    }
  }
}

process().then(() => {
  console.log('\\n✨ All processing attempts completed');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
`;

require('fs').writeFileSync('/tmp/process_statements.ts', script);

// Use tsx to execute the TypeScript
const proc = spawn('npx', ['tsx', '/tmp/process_statements.ts'], {
  cwd: '/home/ubuntu/cfo_budgeting_app/app',
  stdio: 'inherit',
  shell: true
});

proc.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);
  process.exit(code);
});
