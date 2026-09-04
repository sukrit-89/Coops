import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  basePriceCents: z.number().int().min(0)
});

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.roles.includes("platform_admin")) {
    return NextResponse.json({ error: "Platform admin role required." }, { status: 403 });
  }

  const parsed = serviceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid service data." }, { status: 400 });
  }

  const { name, categoryId, description } = parsed.data;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data, error } = await session.supabase
    .from("services")
    .insert({
      name,
      slug,
      category_id: categoryId,
      description: description ?? ""
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ service: data });
}
