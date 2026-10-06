export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/backend${path}`, {
      ...options,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(
      'Não foi possível conectar. Verifique sua conexão e tente novamente.',
      0,
    );
  }

  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join('. ')
      : payload?.message;
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('sessao-expirada'));
    }
    throw new ApiError(
      message || 'Não foi possível concluir esta ação. Tente novamente.',
      response.status,
    );
  }
  return payload as T;
}
