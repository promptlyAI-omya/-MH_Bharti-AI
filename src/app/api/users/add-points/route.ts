import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userId, points } = await req.json();
    if (!userId || !points) return NextResponse.json({ error: 'Missing userId or points' }, { status: 400 });

    await sql`
      UPDATE users 
      SET points = COALESCE(points, 0) + ${points}, 
          leaderboard_points = COALESCE(leaderboard_points, 0) + ${points}
      WHERE id = ${userId}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Add points error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
