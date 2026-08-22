import { NextResponse } from "next/server";
import { findStoreByPublicSlug } from "@/lib/store-lookup";
import { saveArtworkFile } from "@/lib/product-media";
import { embedCorsPreflight, withEmbedCors } from "@/lib/embed-cors";

type Params = { params: Promise<{ slug: string }> };

export async function OPTIONS() {
  return embedCorsPreflight();
}

export async function POST(request: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const store = await findStoreByPublicSlug(slug);
    if (!store || store.signupStatus !== "approved") {
      return withEmbedCors(
        NextResponse.json({ error: "Store not found" }, { status: 404 }),
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return withEmbedCors(
        NextResponse.json({ error: "Choose a file." }, { status: 400 }),
      );
    }
    const saved = await saveArtworkFile({ storeId: store.id, file });
    if (saved.error) {
      return withEmbedCors(
        NextResponse.json({ error: saved.error }, { status: 400 }),
      );
    }
    return withEmbedCors(NextResponse.json({ url: saved.url }));
  } catch (err) {
    console.error("config upload failed", err);
    return withEmbedCors(
      NextResponse.json({ error: "Upload failed." }, { status: 500 }),
    );
  }
}
