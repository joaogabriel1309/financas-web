import type { NextRequest } from 'next/server';
import { handleBackend } from '@/lib/backend';

export const runtime = 'nodejs';

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return handleBackend(request, path);
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
