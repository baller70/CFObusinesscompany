
import { NextRequest, NextResponse } from 'next/server';

// This route is deprecated. Please use /api/bank-statements/status instead.
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/bank-statements/status instead.',
      redirect: '/api/bank-statements/status'
    },
    { status: 410 } // 410 Gone
  );
}
