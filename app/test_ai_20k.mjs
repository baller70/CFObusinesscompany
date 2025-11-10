import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ABACUSAI_API_KEY;

async function testAIExtraction() {
  try {
    console.log('[Test] Reading PDF file...');
    const pdfPath = '/home/ubuntu/Uploads/Jan 2024.pdf';
    const pdfBuffer = readFileSync(pdfPath);
    const base64Content = pdfBuffer.toString('base64');
    
    console.log('[Test] PDF size:', pdfBuffer.length, 'bytes');
    console.log('[Test] Calling AI API with 20,000 max_tokens...');
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[Test] TIMEOUT after 90 seconds');
      controller.abort();
    }, 90000);
    
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 20000,
        temperature: 0.1,
        messages: [{
          role: "user",
          content: [{
            type: "file",
            file: {
              filename: 'Jan 2024.pdf',
              file_data: 'data:application/pdf;base64,' + base64Content
            }
          }, {
            type: "text",
            text: 'Extract ALL transactions from this bank statement PDF across all pages. Return JSON: {"transactions": [{"date":"YYYY-MM-DD","description":"text","amount":number}]}'
          }]
        }],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n[Test] SUCCESS! API responded in', elapsedTime, 'seconds');
    console.log('[Test] Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Test] API Error:', errorText.substring(0, 300));
      return;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[Test] No content in response');
      return;
    }
    
    try {
      const extracted = JSON.parse(content);
      const txnCount = extracted.transactions?.length || 0;
      console.log('[Test] EXTRACTED', txnCount, 'TRANSACTIONS');
      
      if (txnCount === 118) {
        console.log('[Test] ✅ PERFECT! Got all 118 transactions');
      } else if (txnCount > 0) {
        console.log('[Test] ⚠️  Got', txnCount, '/', 118, 'transactions');
      }
    } catch (parseError) {
      console.error('[Test] JSON Parse Error:', parseError.message);
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Test] ❌ Request timed out');
    } else {
      console.error('[Test] ❌ Error:', error.message);
    }
  }
}

testAIExtraction();
