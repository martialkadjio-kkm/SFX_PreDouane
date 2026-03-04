import { NextResponse } from "next/server";

function notImplemented() {
  return NextResponse.json(
    { error: "Auth endpoint not implemented in custom auth mode" },
    { status: 501 }
  );
}

export async function GET() {
  return notImplemented();
}

export async function POST() {
  return notImplemented();
}
