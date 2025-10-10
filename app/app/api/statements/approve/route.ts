
import { NextRequest, NextResponse } from 'next/server';

// This route is deprecated.
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated.',
      message: 'Statement approval functionality has been integrated into the processing workflow.'
    },
    { status: 410 } // 410 Gone
  );
}
