import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('cf-access-authenticated-user-email');
    const userName = request.headers.get('cf-access-authenticated-user-name');

    if (!email) {
      return NextResponse.json({ isAuthenticated: false });
    }

    return NextResponse.json({
      isAuthenticated: true,
      email,
      name: userName || email.split('@')[0],
      picture: null,
    });
  } catch (error) {
    console.error('Cloudflare user endpoint error:', error);
    return NextResponse.json(
      { isAuthenticated: false },
      { status: 500 }
    );
  }
}
