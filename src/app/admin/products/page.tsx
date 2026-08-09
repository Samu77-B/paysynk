import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";

async function updateStock(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.storeId) redirect("/admin/login");

  const variantId = String(formData.get("variantId") || "");
  const stockQty = Number(formData.get("stockQty"));
  if (!variantId || !Number.isInteger(stockQty) || stockQty < 0) return;

  const variant = await prisma.variant.findFirst({
    where: {
      id: variantId,
      product: { storeId: session.user.storeId },
    },
  });
  if (!variant) return;

  await prisma.variant.update({
    where: { id: variantId },
    data: { stockQty },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/s/${session.user.storeSlug}`);
}

async function toggleActive(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.storeId) redirect("/admin/login");

  const productId = String(formData.get("productId") || "");
  const active = formData.get("active") === "true";

  await prisma.product.updateMany({
    where: { id: productId, storeId: session.user.storeId },
    data: { active },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/s/${session.user.storeSlug}`);
}

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/admin/login");

  const products = await prisma.product.findMany({
    where: { storeId: session.user.storeId },
    include: { variants: { orderBy: { sku: "asc" } } },
    orderBy: { title: "asc" },
  });

  const store = await prisma.store.findUniqueOrThrow({
    where: { id: session.user.storeId },
  });

  return (
    <main className="admin-page">
      <h1>Products & stock</h1>
      <p className="muted">
        Edit stock quantities. Variants with 0 stock are hidden from the
        storefront API.
      </p>

      {products.map((product) => (
        <section key={product.id} className="admin-product">
          <div className="section-head">
            <div>
              <h2>{product.title}</h2>
              <p className="muted small">
                {product.kind} · {product.active ? "active" : "inactive"}
              </p>
            </div>
            <form action={toggleActive}>
              <input type="hidden" name="productId" value={product.id} />
              <input
                type="hidden"
                name="active"
                value={product.active ? "false" : "true"}
              />
              <button type="submit" className="btn btn-ghost">
                {product.active ? "Deactivate" : "Activate"}
              </button>
            </form>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Options</th>
                <th>Price</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.sku}</td>
                  <td>
                    {Object.entries((v.options as Record<string, string>) || {})
                      .map(([k, val]) => `${k}: ${val}`)
                      .join(" · ") || "—"}
                  </td>
                  <td>{formatMoney(v.priceMinor, store.currency)}</td>
                  <td colSpan={2}>
                    <form action={updateStock} className="inline-stock">
                      <input type="hidden" name="variantId" value={v.id} />
                      <input
                        type="number"
                        name="stockQty"
                        min={0}
                        defaultValue={v.stockQty}
                      />
                      <button type="submit" className="btn btn-ghost">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
