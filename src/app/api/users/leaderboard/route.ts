import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Top 10 users
    const leaderboard = await sql`
      SELECT id, name, phone, COALESCE(leaderboard_points, 0) as points
      FROM users 
      ORDER BY leaderboard_points DESC NULLS LAST 
      LIMIT 10
    `;

    // Calculate current user rank if userId is provided
    let userRank = null;
    let userPoints = 0;
    if (userId) {
       const userRow = await sql`SELECT COALESCE(leaderboard_points, 0) as points FROM users WHERE id = ${userId}`;
       if (userRow && userRow.length > 0) {
         userPoints = userRow[0].points;
         
         const rankCountQuery = await sql`
           SELECT COUNT(*) as exact
           FROM users
           WHERE COALESCE(leaderboard_points, 0) >= ${userPoints}
         `;
         if (rankCountQuery && rankCountQuery.length > 0) {
           userRank = parseInt(rankCountQuery[0].exact, 10);
         } else {
           userRank = 1;
         }
       }
    }

    return NextResponse.json({ leaderboard, userRank, userPoints });
  } catch (error: unknown) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
