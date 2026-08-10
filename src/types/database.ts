export type PlanTier = "standard" | "retail_pos";

export type OrderStatus =
  | "pending"
  | "paid"
  | "unfulfilled"
  | "fulfilled"
  | "refunded"
  | "cancelled";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Rel = [];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: Rel;
      };
      merchants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan_tier: PlanTier;
          stripe_connect_id: string | null;
          paypal_merchant_id: string | null;
          payments_active: boolean;
          billing_customer_id: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          plan_tier?: PlanTier;
          stripe_connect_id?: string | null;
          paypal_merchant_id?: string | null;
          payments_active?: boolean;
          billing_customer_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          plan_tier?: PlanTier;
          stripe_connect_id?: string | null;
          paypal_merchant_id?: string | null;
          payments_active?: boolean;
          billing_customer_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: Rel;
      };
      merchant_members: {
        Row: {
          id: string;
          merchant_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: Rel;
      };
      products: {
        Row: {
          id: string;
          merchant_id: string;
          title: string;
          slug: string;
          description: string;
          price_in_pence: number;
          compare_at_price_in_pence: number | null;
          sku: string | null;
          stock_quantity: number;
          images: string[];
          tags: string[];
          category: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          title: string;
          slug: string;
          description?: string;
          price_in_pence: number;
          compare_at_price_in_pence?: number | null;
          sku?: string | null;
          stock_quantity?: number;
          images?: string[];
          tags?: string[];
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          title?: string;
          slug?: string;
          description?: string;
          price_in_pence?: number;
          compare_at_price_in_pence?: number | null;
          sku?: string | null;
          stock_quantity?: number;
          images?: string[];
          tags?: string[];
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: Rel;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          title: string;
          sku: string | null;
          price_override: number | null;
          stock_quantity: number;
          options: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          title: string;
          sku?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          options?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          title?: string;
          sku?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          options?: Json;
          created_at?: string;
        };
        Relationships: Rel;
      };
      orders: {
        Row: {
          id: string;
          merchant_id: string;
          customer_email: string | null;
          customer_name: string | null;
          status: OrderStatus;
          total_in_pence: number;
          currency: string;
          items_json: Json;
          shipping_address: Json | null;
          stripe_payment_id: string | null;
          channel: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_email?: string | null;
          customer_name?: string | null;
          status?: OrderStatus;
          total_in_pence?: number;
          currency?: string;
          items_json?: Json;
          shipping_address?: Json | null;
          stripe_payment_id?: string | null;
          channel?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_email?: string | null;
          customer_name?: string | null;
          status?: OrderStatus;
          total_in_pence?: number;
          currency?: string;
          items_json?: Json;
          shipping_address?: Json | null;
          stripe_payment_id?: string | null;
          channel?: string;
          created_at?: string;
        };
        Relationships: Rel;
      };
      billing_invoices: {
        Row: {
          id: string;
          merchant_id: string;
          amount_in_pence: number;
          currency: string;
          status: string;
          invoice_url: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          amount_in_pence: number;
          currency?: string;
          status?: string;
          invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          amount_in_pence?: number;
          currency?: string;
          status?: string;
          invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Relationships: Rel;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      plan_tier: PlanTier;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Merchant = Database["public"]["Tables"]["merchants"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type BillingInvoice = Database["public"]["Tables"]["billing_invoices"]["Row"];
