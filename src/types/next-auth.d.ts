import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      storeId: string;
      storeSlug: string;
    };
  }

  interface User {
    storeId?: string;
    storeSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    storeId?: string;
    storeSlug?: string;
  }
}
