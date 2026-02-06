import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

// Types
export interface FundraiserCartItem {
  fundraiserProductId: number;
  variantId: number;
  quantity: number;
  name: string;
  variantName: string;
  priceCents: number;
  imageUrl: string | null;
  minQuantity: number;
  maxQuantity: number | null;
}

interface FundraiserCartState {
  fundraiserSlug: string | null;
  fundraiserId: number | null;
  participantCode: string | null;
  participantName: string | null;
  items: FundraiserCartItem[];
}

type CartAction =
  | { type: 'SET_FUNDRAISER'; payload: { slug: string; id: number } }
  | { type: 'SET_PARTICIPANT'; payload: { code: string; name: string } | null }
  | { type: 'ADD_ITEM'; payload: FundraiserCartItem }
  | { type: 'REMOVE_ITEM'; payload: { fundraiserProductId: number; variantId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { fundraiserProductId: number; variantId: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: FundraiserCartState };

interface FundraiserCartContextType {
  state: FundraiserCartState;
  setFundraiser: (slug: string, id: number) => void;
  setParticipant: (code: string | null, name: string | null) => void;
  addItem: (item: Omit<FundraiserCartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (fundraiserProductId: number, variantId: number) => void;
  updateQuantity: (fundraiserProductId: number, variantId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const initialState: FundraiserCartState = {
  fundraiserSlug: null,
  fundraiserId: null,
  participantCode: null,
  participantName: null,
  items: [],
};

function cartReducer(state: FundraiserCartState, action: CartAction): FundraiserCartState {
  switch (action.type) {
    case 'SET_FUNDRAISER':
      // If switching fundraisers, clear the cart
      if (state.fundraiserSlug && state.fundraiserSlug !== action.payload.slug) {
        return {
          ...initialState,
          fundraiserSlug: action.payload.slug,
          fundraiserId: action.payload.id,
        };
      }
      return {
        ...state,
        fundraiserSlug: action.payload.slug,
        fundraiserId: action.payload.id,
      };

    case 'SET_PARTICIPANT':
      return {
        ...state,
        participantCode: action.payload?.code || null,
        participantName: action.payload?.name || null,
      };

    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) =>
          item.fundraiserProductId === action.payload.fundraiserProductId &&
          item.variantId === action.payload.variantId
      );

      if (existing) {
        const newQuantity = existing.quantity + action.payload.quantity;
        // Check max quantity
        if (action.payload.maxQuantity && newQuantity > action.payload.maxQuantity) {
          return state;
        }
        return {
          ...state,
          items: state.items.map((item) =>
            item.fundraiserProductId === action.payload.fundraiserProductId &&
            item.variantId === action.payload.variantId
              ? { ...item, quantity: newQuantity }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.fundraiserProductId === action.payload.fundraiserProductId &&
              item.variantId === action.payload.variantId
            )
        ),
      };

    case 'UPDATE_QUANTITY': {
      const item = state.items.find(
        (i) =>
          i.fundraiserProductId === action.payload.fundraiserProductId &&
          i.variantId === action.payload.variantId
      );
      if (!item) return state;

      // Respect min/max quantity
      let newQuantity = action.payload.quantity;
      if (newQuantity < item.minQuantity) {
        newQuantity = item.minQuantity;
      }
      if (item.maxQuantity && newQuantity > item.maxQuantity) {
        newQuantity = item.maxQuantity;
      }

      return {
        ...state,
        items: state.items.map((i) =>
          i.fundraiserProductId === action.payload.fundraiserProductId &&
          i.variantId === action.payload.variantId
            ? { ...i, quantity: newQuantity }
            : i
        ),
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
}

const FundraiserCartContext = createContext<FundraiserCartContextType | null>(null);

// Helper to get localStorage key for a fundraiser
const getStorageKey = (slug: string) => `fundraiser_cart_${slug}`;

export function FundraiserCartProvider({
  children,
  fundraiserSlug,
}: {
  children: ReactNode;
  fundraiserSlug?: string;
}) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage when fundraiser changes
  useEffect(() => {
    if (fundraiserSlug) {
      const storageKey = getStorageKey(fundraiserSlug);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.fundraiserSlug === fundraiserSlug) {
            dispatch({ type: 'LOAD_CART', payload: parsed });
            return;
          }
        } catch (e) {
          console.error('Failed to parse saved cart:', e);
        }
      }
      // No saved cart or different fundraiser, just set the fundraiser
      dispatch({ type: 'SET_FUNDRAISER', payload: { slug: fundraiserSlug, id: 0 } });
    }
  }, [fundraiserSlug]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (state.fundraiserSlug) {
      const storageKey = getStorageKey(state.fundraiserSlug);
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state]);

  const setFundraiser = (slug: string, id: number) => {
    dispatch({ type: 'SET_FUNDRAISER', payload: { slug, id } });
  };

  const setParticipant = (code: string | null, name: string | null) => {
    if (code && name) {
      dispatch({ type: 'SET_PARTICIPANT', payload: { code, name } });
    } else {
      dispatch({ type: 'SET_PARTICIPANT', payload: null });
    }
  };

  const addItem = (item: Omit<FundraiserCartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...item,
        quantity: item.quantity || item.minQuantity || 1,
      },
    });
  };

  const removeItem = (fundraiserProductId: number, variantId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { fundraiserProductId, variantId } });
  };

  const updateQuantity = (fundraiserProductId: number, variantId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { fundraiserProductId, variantId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    if (state.fundraiserSlug) {
      const storageKey = getStorageKey(state.fundraiserSlug);
      localStorage.removeItem(storageKey);
    }
  };

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  return (
    <FundraiserCartContext.Provider
      value={{
        state,
        setFundraiser,
        setParticipant,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </FundraiserCartContext.Provider>
  );
}

export function useFundraiserCart() {
  const context = useContext(FundraiserCartContext);
  if (!context) {
    throw new Error('useFundraiserCart must be used within a FundraiserCartProvider');
  }
  return context;
}
