import api from './api';

// Types
export interface Fundraiser {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  public_message: string | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  goal_amount_cents: number | null;
  raised_amount_cents: number | null;
  progress_percentage: number;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  pickup_location: string | null;
  pickup_instructions: string | null;
  allow_shipping: boolean;
  can_order: boolean;
  organization_name?: string | null;
}

export interface FundraiserProductVariant {
  id: number;
  display_name: string;
  size: string;
  color: string;
  sku: string;
  in_stock: boolean;
  stock_quantity: number;
  options?: Record<string, string>;
}

export interface FundraiserProductImage {
  id: number;
  url: string;
  alt_text: string;
  position: number;
  primary: boolean;
}

export interface FundraiserProduct {
  id: number;
  product_id: number;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  min_quantity: number;
  max_quantity: number | null;
  image_url: string | null;
  images?: FundraiserProductImage[];
  variants: FundraiserProductVariant[];
  in_stock: boolean;
}

export interface Participant {
  id: number;
  name: string;
  participant_number: string | null;
  code: string;
  display_name: string;
}

export interface ShippingRate {
  carrier: string;
  service: string;
  rate_cents: number;
  rate_id?: string;
  delivery_days?: number;
  delivery_date?: string;
}

export interface FundraiserOrderItem {
  fundraiser_product_id: number;
  variant_id: number;
  quantity: number;
}

export interface FundraiserOrderRequest {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  // Legacy aliases (kept for backward compatibility with older payloads)
  email?: string;
  phone?: string;
  participant_code?: string;
  delivery_method: 'pickup' | 'shipping';
  shipping_address?: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shipping_method?: {
    carrier: string;
    service: string;
    rate_cents: number;
    rate_id?: string;
  };
  items: FundraiserOrderItem[];
  payment_intent_id?: string;
}

export interface FundraiserOrder {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_cents: number;
  formatted_total: string;
  subtotal_cents: number;
  shipping_cents: number;
  items: Array<{
    id: number;
    product_name: string;
    variant_name: string;
    quantity: number;
    price_cents: number;
  }>;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  // Legacy aliases from previous API versions
  email?: string;
  phone?: string;
  delivery_method: 'pickup' | 'shipping';
  shipping_address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  pickup_location?: string;
  pickup_instructions?: string;
  participant_name?: string;
  fundraiser_name: string;
  created_at: string;
}

export interface FundraiserResponse {
  fundraiser: Fundraiser;
  products: FundraiserProduct[];
  participants: Participant[];
}

// API Service
const fundraiserPublicService = {
  /**
   * Get fundraiser details by slug
   */
  getFundraiser: async (slug: string): Promise<FundraiserResponse> => {
    const response = await api.get(`/fundraisers/${slug}`);
    return response.data;
  },

  /**
   * Get all products for a fundraiser
   */
  getFundraiserProducts: async (slug: string): Promise<FundraiserProduct[]> => {
    const response = await api.get(`/fundraisers/${slug}`);
    return response.data.products;
  },

  /**
   * Get a specific product by slug
   */
  getFundraiserProduct: async (fundraiserSlug: string, productSlug: string): Promise<FundraiserProduct | null> => {
    const response = await api.get(`/fundraisers/${fundraiserSlug}`);
    const products: FundraiserProduct[] = response.data.products;
    return products.find(p => p.slug === productSlug) || null;
  },

  /**
   * Get participant info by code
   */
  getParticipantByCode: async (fundraiserSlug: string, code: string): Promise<Participant | null> => {
    const response = await api.get(`/fundraisers/${fundraiserSlug}`);
    const participants: Participant[] = response.data.participants;
    return participants.find(p => p.code === code) || null;
  },

  /**
   * Calculate shipping rates for fundraiser order
   */
  calculateShipping: async (
    fundraiserSlug: string,
    items: FundraiserOrderItem[],
    address: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    }
  ): Promise<{ rates: ShippingRate[]; total_weight_oz: number }> => {
    const response = await api.post(`/fundraisers/${fundraiserSlug}/shipping_rates`, {
      items,
      address,
    });
    return response.data;
  },

  /**
   * Create payment intent for fundraiser order
   */
  createPaymentIntent: async (
    fundraiserSlug: string,
    data: {
      email: string;
      amount_cents: number;
      items: FundraiserOrderItem[];
    }
  ): Promise<{ client_secret: string; payment_intent_id: string }> => {
    const response = await api.post(`/fundraisers/${fundraiserSlug}/payment_intents`, data);
    return response.data;
  },

  /**
   * Create a fundraiser order
   */
  createOrder: async (
    fundraiserSlug: string,
    orderData: FundraiserOrderRequest
  ): Promise<{ success: boolean; order: FundraiserOrder }> => {
    const response = await api.post(`/fundraisers/${fundraiserSlug}/orders`, { order: orderData });
    return response.data;
  },
};

export default fundraiserPublicService;
