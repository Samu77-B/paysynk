import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveProductImageFile } from "@/lib/product-media";

export async function POST(request: Request) {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) {
    return NextResponse.json({ error: "Sign in to upload." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  }

  const saved = await saveProductImageFile({ storeId, file });
  if (saved.error) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  return NextResponse.json({ url: saved.url });
}
