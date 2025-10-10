
import { NextRequest, NextResponse } from 'next/server';

// This route is deprecated. Please use /api/bank-statements/upload instead.
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use /api/bank-statements/upload instead.',
      redirect: '/api/bank-statements/upload'
    },
    { status: 410 } // 410 Gone
  );
}
