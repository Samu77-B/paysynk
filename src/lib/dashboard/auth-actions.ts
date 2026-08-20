"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { safeInternalPath } from "@/lib/safe-path";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function registerMerchant(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const storeName = String(formData.get("storeName") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!fullName || !storeName || !email || password.length < 8) {
    redirect("/register?error=invalid");
  }

  const taken = await prisma.merchantUser.findUnique({ where: { email } });
  if (taken) {
    redirect("/register?error=exists");
  }

  let slug = slugify(storeName) || "store";
  if (await prisma.store.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.store.create({
      data: {
        name: storeName,
        slug,
        signupStatus: "pending",
        users: {
          create: {
            email,
            passwordHash,
            name: fullName,
          },
        },
      },
    });
  } catch {
    redirect("/register?error=exists");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/app",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw e;
  }
}

export async function loginMerchant(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = safeInternalPath(formData.get("next"));

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: next,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw e;
  }
}

export async function signOutMerchant() {
  await signOut({ redirectTo: "/login" });
}
