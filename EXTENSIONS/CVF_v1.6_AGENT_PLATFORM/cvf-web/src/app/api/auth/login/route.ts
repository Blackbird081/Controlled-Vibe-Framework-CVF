import { NextResponse } from 'next/server';
import { createSession, SessionPayload } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
        }

        const expectedUser = process.env.CVF_ADMIN_USER || 'admin';
        const expectedPass = process.env.CVF_ADMIN_PASS ?? 'admin123';

        if (username !== expectedUser || password !== expectedPass) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        // Role is determined server-side, never trust client-sent role values
        const roleValue = (username === expectedUser ? 'admin' : 'viewer') as SessionPayload['role'];
        await createSession(username, roleValue);

        return NextResponse.json({ success: true, user: username, role: roleValue });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
