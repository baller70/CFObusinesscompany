import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ABACUSAI_API_KEY;

async function testAIExtraction() {
  try {
    console.log('Reading PDF file...');
    const pdfPath = '/home/ubuntu/Uploads/Jan 2024.pdf';
    const pdfBuffer = readFileSync(pdfPath);
    const base64Content = pdfBuffer.toString('base64');
    
    console.log('PDF size:', pdfBuffer.length, 'bytes');
    console.log('Base64 size:', base64Content.length, 'characters');
    console.log('API Key exists:', !!API_KEY);
    
    console.log('\nCalling AI API with 80,000 max_tokens...');
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('\nTIMEOUT after 90 seconds');
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
        max_tokens: 80000,
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
            text: 'Extract ALL transactions from this PNC bank statement. Return JSON: {"transactions": [{"date":"YYYY-MM-DD","description":"text","amount":number,"type":"debit|credit"}]}'
          }]
        }],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\nAPI responded in', elapsedTime, 'seconds');
    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('\nAPI Error:', errorText.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('\nNo content in response');
      return;
    }
    
    console.log('\nResponse length:', content.length, 'characters');
    
    try {
      const extracted = JSON.parse(content);
      const txnCount = extracted.transactions?.length || 0;
      console.log('\nEXTRACTED', txnCount, 'TRANSACTIONS');
      
      if (txnCount === 118) {
        console.log('\nSUCCESS! Got all 118 transactions');
      } else if (txnCount > 0) {
        console.log('\nWARNING: Got', txnCount, 'transactions, expected 118');
      }
    } catch (parseError) {
      console.error('\nJSON Parse Error:', parseError.message);
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('\nRequest timed out after 90 seconds');
    } else {
      console.error('\nError:', error.message);
    }
  }
}

testAIExtraction();
