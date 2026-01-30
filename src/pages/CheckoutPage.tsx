import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useCartStore } from '../store/cartStore';
import { configApi, ordersApi, shippingApi, paymentIntentsApi, formatPrice } from '../services/api';
import type { ShippingAddress, ShippingMethod, AppConfig } from '../types/order';
import StripeProvider from '../components/payment/StripeProvider';
import PaymentForm from '../components/payment/PaymentForm';

/**
 * Inner checkout form that has access to Stripe hooks.
 * Must be rendered inside StripeProvider.
 */
function CheckoutForm() {