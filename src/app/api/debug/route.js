import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    hasKey: !!key,
    keyLength: key ? key.length : 0,
    keyPrefix: key ? key.substring(0, 15) : 'EMPTY_OR_UNDEFINED',
    typeofKey: typeof key,
    isEmptyString: key === '',
    isUndefined: key === undefined,
  });
}
