import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env.js';

const STATE_TTL_MS = 10 * 60 * 1000;
const PURPOSE = 'google-calendar-connect';

interface GoogleCalendarStatePayload {
  purpose: typeof PURPOSE;
  userId: string;
  issuedAt: number;
}

type VerifyGoogleCalendarStateResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid' | 'expired' };

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function getStateSecret(): string {
  return env.oauthStateSecret ?? env.clerkSecretKey;
}

function sign(payload: string): string {
  return createHmac('sha256', getStateSecret()).update(payload).digest('base64url');
}

export function createGoogleCalendarState(userId: string, now = Date.now()): string {
  const payload = encodeBase64Url(JSON.stringify({
    purpose: PURPOSE,
    userId,
    issuedAt: now,
  } satisfies GoogleCalendarStatePayload));

  return `${payload}.${sign(payload)}`;
}

export function verifyGoogleCalendarState(state: string, now = Date.now()): VerifyGoogleCalendarStateResult {
  const [payloadPart, signaturePart, ...rest] = state.split('.');

  if (!payloadPart || !signaturePart || rest.length > 0) {
    return { ok: false, reason: 'invalid' };
  }

  const expectedSignature = sign(payloadPart);
  const providedSignature = Buffer.from(signaturePart, 'utf8');
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    return { ok: false, reason: 'invalid' };
  }

  const decodedPayload = decodeBase64Url(payloadPart);
  if (!decodedPayload) {
    return { ok: false, reason: 'invalid' };
  }

  try {
    const payload = JSON.parse(decodedPayload) as Partial<GoogleCalendarStatePayload>;

    if (
      payload.purpose !== PURPOSE ||
      typeof payload.userId !== 'string' ||
      payload.userId.length === 0 ||
      typeof payload.issuedAt !== 'number'
    ) {
      return { ok: false, reason: 'invalid' };
    }

    if (now - payload.issuedAt > STATE_TTL_MS) {
      return { ok: false, reason: 'expired' };
    }

    if (payload.issuedAt > now + 60_000) {
      return { ok: false, reason: 'invalid' };
    }

    return { ok: true, userId: payload.userId };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
