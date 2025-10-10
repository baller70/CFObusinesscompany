
import { NextRequest, NextResponse } from 'next/server';

// This route is deprecated. Please use /api/bank-statements/* endpoints instead.
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated.',
      message: 'Statement listing has been moved to the upload history component.'
    },
    { status: 410 } // 410 Gone
  );
}
