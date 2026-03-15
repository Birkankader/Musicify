import { NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;

  if (!teamId || !keyId) {
    return NextResponse.json(
      { error: 'Apple Music credentials not configured (APPLE_TEAM_ID or APPLE_KEY_ID missing)' },
      { status: 500 }
    );
  }

  try {
    // Try reading from .p8 file first, fall back to env var
    let privateKeyPem: string;

    const keyFileName = `AuthKey_${keyId}.p8`;
    const keyFilePath = join(process.cwd(), keyFileName);

    try {
      privateKeyPem = readFileSync(keyFilePath, 'utf-8');
    } catch {
      // Fall back to env var
      const envKey = process.env.APPLE_PRIVATE_KEY;
      if (!envKey) {
        return NextResponse.json(
          { error: `Private key not found: neither ${keyFileName} file nor APPLE_PRIVATE_KEY env var exists` },
          { status: 500 }
        );
      }
      privateKeyPem = envKey.replace(/\\n/g, '\n').trim();
    }

    const privateKey = await importPKCS8(privateKeyPem, 'ES256');

    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .setExpirationTime(now + 60 * 60 * 24 * 180) // 180 days
      .sign(privateKey);

    return NextResponse.json({ token });
  } catch (err) {
    console.error('Apple Music token generation failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate developer token' },
      { status: 500 }
    );
  }
}
