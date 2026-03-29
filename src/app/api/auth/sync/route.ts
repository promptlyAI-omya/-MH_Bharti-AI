import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, name, phone } = body;

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const users = await sql`
      INSERT INTO users (id, email, name, phone)
      VALUES (${uid}, ${email || null}, ${name || null}, ${phone || null})
      ON CONFLICT (id) DO UPDATE
      SET
        email = COALESCE(EXCLUDED.email, users.email),
        name = COALESCE(EXCLUDED.name, users.name),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        updated_at = NOW()
      RETURNING *
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found after sync" }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] });
  } catch (error: unknown) {
    console.error("Auth sync error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
