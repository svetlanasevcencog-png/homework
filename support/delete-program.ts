import dotenv from 'dotenv';
import path from 'path';

export type DidaxisConfig = {
  baseUrl: string;
  token: string;
};

export type ProgramSummary = {
  id: string;
  name: string;
};

export type DeleteResult = {
  id: string;
  ok: boolean;
  status: number;
  message: string;
};

export type VerifyResult = {
  id: string;
  verified: boolean;
  status: number;
  message: string;
};

function projectRoot(): string {
  return path.resolve(__dirname, '..');
}

export function loadConfig(): DidaxisConfig {
  dotenv.config({ path: path.join(projectRoot(), '.env'), override: true });

  const baseUrl = process.env.DIDAXIS_URL;
  const token = process.env.DIDAXIS_API_TOKEN;

  if (!baseUrl || !token) {
    throw new Error(
      'DIDAXIS_URL and DIDAXIS_API_TOKEN must be defined in .env at the project root.',
    );
  }

  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function listPrograms(config: DidaxisConfig): Promise<ProgramSummary[]> {
  const response = await fetch(`${config.baseUrl}/api/programs`, {
    headers: authHeaders(config.token),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GET /api/programs failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { data?: Array<{ id: string; name: string }> };
  return (payload.data ?? []).map((program) => ({
    id: program.id,
    name: program.name,
  }));
}

export async function deleteProgram(
  config: DidaxisConfig,
  id: string,
): Promise<DeleteResult> {
  const response = await fetch(`${config.baseUrl}/api/programs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(config.token),
  });

  const body = await response.text();
  let message = body;
  try {
    const parsed = JSON.parse(body) as { message?: string };
    message = parsed.message ?? body;
  } catch {
    // keep raw body
  }

  return {
    id,
    ok: response.ok || response.status === 404,
    status: response.status,
    message,
  };
}

export async function verifyProgramDeleted(
  config: DidaxisConfig,
  id: string,
): Promise<VerifyResult> {
  const response = await fetch(`${config.baseUrl}/api/programs/${id}`, {
    headers: authHeaders(config.token),
  });

  const body = await response.text();
  let message = body;
  try {
    const parsed = JSON.parse(body) as { message?: string };
    message = parsed.message ?? body;
  } catch {
    // keep raw body
  }

  return {
    id,
    verified: response.status === 404,
    status: response.status,
    message,
  };
}
