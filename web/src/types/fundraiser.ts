/**
 * Fundraiser-related TypeScript interfaces
 */

export interface Fundraiser {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  organization_name: string | null;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  start_date: string | null;
  end_date: string | null;
  goal_amount_cents: number | null;
  raised_amount_cents: number | null;
  progress_percentage: number;
  payout_percentage: number | null;
  published: boolean;
  image_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  pickup_location: string | null;
  pickup_instructions: string | null;
  allow_shipping: boolean;
  shipping_note: string | null;
  public_message: string | null;
  thank_you_message: string | null;
  participant_count: number;
  product_count: number;
  order_count: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_ended: boolean;
  created_at: string;
  updated_at: string;
}

export interface FundraiserFormData {
  name: string;
  slug: string;
  description: string;
  organization_name: string;
  status: string;
  start_date: string;
  end_date: string;
  goal_amount_cents: string; // String for form handling, converted to number on submit
  payout_percentage: string;
  image_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  pickup_location: string;
  pickup_instructions: string;
  allow_shipping: boolean;
  shipping_note: string;
  public_message: string;
  thank_you_message: string;
  published: boolean;
}

export interface FundraiserProduct {
  id: number;
  fundraiser_id: number;
  product_id: number;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  original_price_cents: number;
  position: number;
  active: boolean;
  image_url: string | null;
  variant_count: number;
  in_stock: boolean;
}

export interface AvailableProduct {
  id: number;
  name: string;
  slug: string;
  base_price_cents: number;
  image_url: string | null;
}

export interface Participant {
  id: number;
  fundraiser_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  unique_code: string | null;
  participant_number: string | null;
  goal_amount_cents: number | null;
  total_raised_cents: number;
  total_sales_cents: number;
  order_count: number;
  active: boolean;
  display_name: string;
  shareable_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipantFormData {
  name: string;
  email: string;
  phone: string;
  participant_number: string;
  goal_amount_cents: string; // String for form handling
}

export interface FundraiserOrder {
  id: number;
  order_number: string;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  participant_id: number | null;
  participant_name: string | null;
  participant_number: string | null;
  items: FundraiserOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface FundraiserOrderItem {
  id: number;
  name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  variant_name: string | null;
}

export interface FundraiserStats {
  total_raised_cents: number;
  goal_amount_cents: number | null;
  progress_percentage: number;
  order_count: number;
  participant_count: number;
  product_count: number;
  average_order_cents: number;
  top_participants: {
    id: number;
    name: string;
    total_raised_cents: number;
    order_count: number;
  }[];
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}
