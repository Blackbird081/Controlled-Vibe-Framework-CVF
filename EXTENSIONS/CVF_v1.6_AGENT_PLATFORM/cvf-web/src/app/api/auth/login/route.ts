import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, password, role } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
        }

        const expectedUser = process.env.CVF_ADMIN_USER || 'admin';
        const expectedPass = process.env.CVF_ADMIN_PASS ?? 'admin123';

        if (username !== expectedUser || password !== expectedPass) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        const roleValue = role === 'editor' || role === 'viewer' ? role : 'admin';
        await createSession(username, roleValue);

        return NextResponse.json({ success: true, user: username, role: roleValue });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
