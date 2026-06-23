export interface CartItem {
  id: string;
  name: string;
  price: number;
  restaurantId: string;
  restaurantName: string;
  dishId: string;
  dishName: string;
  unitPrice: number;
  quantity: number;
  image?: string;
}

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function addToCart(
  dish: { _id?: string; name: string; price: number; image?: string },
  restaurant: { _id: string; name: string },
  currentCart: CartItem[]
): CartItem[] {
  if (!restaurant || !dish._id) {
    throw new Error('Invalid dish or restaurant');
  }

  const dishId = dish._id;
  const existing = currentCart.find((item) => item.dishId === dishId);

  if (existing) {
    return currentCart.map((item) =>
      item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
    );
  }

  return [
    ...currentCart,
    {
      id: dishId,
      name: dish.name,
      price: dish.price,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      dishId,
      dishName: dish.name,
      unitPrice: dish.price,
      quantity: 1,
      image: dish.image,
    },
  ];
}

export function removeFromCart(dishId: string, cart: CartItem[]): CartItem[] {
  return cart.filter((item) => item.dishId !== dishId);
}

export function updateQuantity(dishId: string, quantity: number, cart: CartItem[]): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(dishId, cart);
  }

  return cart.map((item) => (item.dishId === dishId ? { ...item, quantity } : item));
}

export function clearCart(): void {
  localStorage.removeItem('cart');
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function getTotalItems(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function validateCartItems(items: unknown[]): CartItem[] {
  return items.filter((value): value is CartItem => {
    if (!value || typeof value !== 'object') return false;
    const item = value as Partial<CartItem>;
    return Boolean(
      item.restaurantId &&
        item.restaurantName &&
        item.dishId &&
        item.dishName &&
        typeof item.unitPrice === 'number' &&
        typeof item.quantity === 'number'
    );
  });
}

export interface RestaurantGroup {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export function groupCartByRestaurant(cart: CartItem[]): RestaurantGroup[] {
  const grouped = cart.reduce<Record<string, CartItem[]>>((acc, item) => {
    const key = item.restaurantId;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(grouped).map(([restaurantId, items]) => {
    const firstItem = items[0];
    return {
      restaurantId,
      restaurantName: firstItem.restaurantName,
      items,
      subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}

export interface CartSummary {
  groups: RestaurantGroup[];
  totalRestaurants: number;
  totalItems: number;
  subtotal: number;
  canMultiOrder: boolean;
}

export function getCartSummary(cart: CartItem[]): CartSummary {
  const groups = groupCartByRestaurant(cart);
  const totalItems = getTotalItems(cart);
  const subtotal = getCartTotal(cart);

  return {
    groups,
    totalRestaurants: groups.length,
    totalItems,
    subtotal,
    canMultiOrder: groups.length > 1,
  };
}

export function getRestaurantSubtotals(cart: CartItem[]): Record<string, number> {
  return cart.reduce<Record<string, number>>((acc, item) => {
    const key = item.restaurantId;
    acc[key] = (acc[key] || 0) + item.unitPrice * item.quantity;
    return acc;
  }, {});
}
