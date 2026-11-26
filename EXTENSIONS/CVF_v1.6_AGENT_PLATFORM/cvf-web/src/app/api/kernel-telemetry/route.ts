import { NextResponse } from 'next/server';

// This Web route has no runtime telemetry source wired to it.
export async function GET() {
    return NextResponse.json({ traces: [], riskHistory: [], stats: null });
}
