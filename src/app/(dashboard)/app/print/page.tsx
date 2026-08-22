import { redirect } from "next/navigation";

export default function PrintProductsRedirect() {
  redirect("/app/products#print");
}
