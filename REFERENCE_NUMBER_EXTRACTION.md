# Reference Number Extraction Feature

## Overview
Enhanced the AI-powered text extraction feature to capture **reference numbers** for each transaction when using the "PASTE STATEMENT TEXT" functionality.

## Changes Made

### 1. AI Processor Enhancement (`lib/ai-processor.ts`)

#### Updated Extraction Rules:
Added specific extraction rules for reference numbers:
- Look for patterns like: "REF: 12345", "REF#", "Transaction ID:", "Confirmation:", "Check #"
- Extract as separate field: `referenceNumber`
- If no reference number found, set to null or empty string
- Reference numbers are usually on same line or next line after description

#### Updated JSON Output Format:
```json
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Full transaction description",
      "amount": 123.45,
      "type": "EXPENSE" or "INCOME",
      "category": "Category name from section header",
      "merchant": "Merchant name if identifiable",
      "referenceNumber": "REF: 12345 or transaction ID or confirmation code",
      "notes": "Any additional info"
    }
  ]
}
```

### 2. API Endpoint Update (`app/api/bank-statements/process-text/route.ts`)

#### Database Storage:
- Reference numbers are now stored in the `metadata` JSON field
- Structure: `{ referenceNumber: "...", notes: "..." }`
- Only populated if reference number exists

#### Enhanced Logging:
Added console logging to show sample transactions with reference numbers:
```
[Process Text] Sample transactions with reference numbers:
  1. Date: 2024-01-08, Amount: 250.00, Description: STRIPE TRANSFER
     Reference: REF: 1234567890
```

## Transaction Fields Captured

Each transaction now captures all 4 required fields:

1. ✅ **Date Posted** - Extracted as `date` field
2. ✅ **Amount** - Extracted as `amount` field
3. ✅ **Transaction Description** - Extracted as `description` field
4. ✅ **Reference Number** - Extracted as `referenceNumber` field (stored in metadata)

## How to Use

### 1. Navigate to Bank Statements Page
Go to: Dashboard → Bank Statements

### 2. Use "PASTE STATEMENT TEXT" Section
- Enter the statement date in the date field
- Paste the full statement text in the large text area
- Click "Process Text"

### 3. AI Extraction
The AI will automatically:
- Extract all transactions from the pasted text
- Capture date, amount, description, and reference number for each transaction
- Categorize transactions based on section headers
- Save to database with reference numbers in metadata

### 4. View Results
- Check the "Recent Statements" section for processing status
- View transaction details in the Transactions page
- Reference numbers are stored and can be queried from the database

## Database Schema

### Transaction Model:
```prisma
model Transaction {
  id                  String        @id @default(cuid())
  date                DateTime
  amount              Float
  description         String
  merchant            String?
  category            String
  type                TransactionType
  metadata            Json?         // Contains referenceNumber and notes
  ...
}
```

### Metadata Structure:
```json
{
  "referenceNumber": "REF: 1234567890",
  "notes": "Additional transaction notes"
}
```

## Testing

### Test the Manual Text Entry:
1. Login to app: https://cfo-budgeting-app-zgajgy.abacusai.app
2. Navigate to Bank Statements
3. Paste sample statement text with reference numbers
4. Verify extraction includes all fields

### Sample Statement Text:
```
PNC Bank Business Statement
January 8, 2024

Deposits:
01/05/24    Mobile Deposit    REF: 987654321    250.00
01/10/24    Wire Transfer     REF: 123456789    1,500.00

ACH Additions:
01/08/24    STRIPE TRANSFER   REF: ACH001234    3,245.67
01/15/24    PAYPAL PAYOUT     REF: PP789012     892.50
```

## Technical Details

### AI Model Configuration:
- Model: GPT-4o (strongest available)
- Max Tokens: 20,000
- Temperature: 0.1 (for high accuracy)
- Timeout: 3 minutes

### Error Handling:
- Validates transaction structure before saving
- Filters out transactions with missing dates or zero amounts
- Logs warnings for invalid transactions
- Graceful fallback if reference number not found

## Next Steps

### Future Enhancements:
1. Display reference numbers in transaction list UI
2. Add search/filter by reference number
3. Validate reference number formats (optional)
4. Export reference numbers in CSV exports
5. Add reference number to transaction details modal

## Files Modified

1. `/app/lib/ai-processor.ts` - Enhanced AI extraction prompt
2. `/app/app/api/bank-statements/process-text/route.ts` - Added metadata storage

## Status

✅ **READY FOR TESTING**

The AI extraction now captures all required transaction fields including reference numbers when using the "PASTE STATEMENT TEXT" feature.
