import { NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKeyRaw) {
    return NextResponse.json(
      { error: 'Apple Music credentials not configured' },
      { status: 500 }
    );
  }

  try {
    // The private key might have escaped newlines from .env
    const privateKeyPem = privateKeyRaw.replace(/\\n/g, '\n');
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
