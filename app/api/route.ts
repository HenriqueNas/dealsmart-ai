import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    versions: ['v1'],
    endpoints: {
      status: '/api/v1/status',
      migrations: '/api/v1/migrations',
    },
  });
}
