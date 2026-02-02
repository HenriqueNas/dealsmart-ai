import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    versions: ['v1'],
    health: '/api/v1/health',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        logout: 'POST /api/v1/auth/logout',
        nextauth: '/api/auth/[...nextauth]',
      },
      users: {
        me: {
          get: '/api/v1/users/me',
          update: 'PATCH /api/v1/users/me',
        },
        byId: {
          get: '/api/v1/users/:id',
          update: 'PATCH /api/v1/users/:id',
          delete: 'DELETE /api/v1/users/:id',
        },
        verifyAge: 'POST /api/v1/users/verify-age',
      },
      conversations: {
        list: '/api/v1/conversations',
        create: 'POST /api/v1/conversations',
        byId: {
          get: '/api/v1/conversations/:id',
          update: 'PATCH /api/v1/conversations/:id',
          delete: 'DELETE /api/v1/conversations/:id',
        },
        messages: {
          list: '/api/v1/conversations/:id/messages',
          create: 'POST /api/v1/conversations/:id/messages',
        },
      },
    },
  });
}
