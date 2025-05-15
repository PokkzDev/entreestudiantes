import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "No image url provided" }, { status: 400 });
    }
    // Only allow deletion from /images/
    if (!url.startsWith("/images/")) {
      return NextResponse.json({ success: false, error: "Invalid image path" }, { status: 400 });
    }
    const filePath = path.join(process.cwd(), "public", url.replace("/images/", "images/"));
    await fs.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
