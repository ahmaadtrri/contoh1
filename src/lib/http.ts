import { NextResponse } from "next/server";
import { z, ZodType } from "zod";

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  const body = await request.json();
  return schema.parse(body);
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function zodError(error: z.ZodError) {
  return badRequest("Payload tidak valid.", error.flatten());
}

