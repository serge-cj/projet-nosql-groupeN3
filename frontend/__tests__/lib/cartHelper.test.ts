import {
  addToCart,
  removeFromCart,
  updateQuantity,
  getCartTotal,
  getTotalItems,
  validateCartItems,
  groupCartByRestaurant,
  getCartSummary,
  getRestaurantSubtotals,
  type CartItem,
} from '@/lib/cartHelper';

describe('Cart Helper Functions', () => {
  const mockRestaurant = {
    _id: 'rest-1',
    name: 'Test Restaurant',
  };

  const mockDish = {
    _id: 'dish-1',
    name: 'Test Dish',
    price: 5000,
    image: 'test.jpg',
  };

  describe('addToCart', () => {
    it('should add a new item to an empty cart', () => {
      const result = addToCart(mockDish, mockRestaurant, []);
      expect(result).toHaveLength(1);
      expect(result[0].dishId).toBe('dish-1');
      expect(result[0].quantity).toBe(1);
    });

    it('should increment quantity if item already exists', () => {
      const existingCart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish',
          unitPrice: 5000,
          quantity: 1,
        },
      ];

      const result = addToCart(mockDish, mockRestaurant, existingCart);
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(2);
    });

    it('should throw error if dish has no _id', () => {
      const invalidDish = { name: 'Test', price: 5000 };
      expect(() => addToCart(invalidDish as any, mockRestaurant, [])).toThrow();
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish',
          unitPrice: 5000,
          quantity: 1,
        },
      ];

      const result = removeFromCart('dish-1', cart);
      expect(result).toHaveLength(0);
    });

    it('should not remove unrelated items', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 1,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 6000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 6000,
          quantity: 1,
        },
      ];

      const result = removeFromCart('dish-1', cart);
      expect(result).toHaveLength(1);
      expect(result[0].dishId).toBe('dish-2');
    });
  });

  describe('updateQuantity', () => {
    const cart: CartItem[] = [
      {
        id: 'dish-1',
        name: 'Test Dish',
        price: 5000,
        restaurantId: 'rest-1',
        restaurantName: 'Test Restaurant',
        dishId: 'dish-1',
        dishName: 'Test Dish',
        unitPrice: 5000,
        quantity: 2,
      },
    ];

    it('should update quantity to positive number', () => {
      const result = updateQuantity('dish-1', 5, cart);
      expect(result[0].quantity).toBe(5);
    });

    it('should remove item if quantity is 0', () => {
      const result = updateQuantity('dish-1', 0, cart);
      expect(result).toHaveLength(0);
    });

    it('should remove item if quantity is negative', () => {
      const result = updateQuantity('dish-1', -1, cart);
      expect(result).toHaveLength(0);
    });
  });

  describe('getCartTotal', () => {
    it('should calculate total for empty cart', () => {
      const total = getCartTotal([]);
      expect(total).toBe(0);
    });

    it('should calculate total for single item', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish',
          unitPrice: 5000,
          quantity: 2,
        },
      ];

      const total = getCartTotal(cart);
      expect(total).toBe(10000);
    });

    it('should calculate total for multiple items', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 2,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 6000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 6000,
          quantity: 1,
        },
      ];

      const total = getCartTotal(cart);
      expect(total).toBe(16000);
    });
  });

  describe('getTotalItems', () => {
    it('should return 0 for empty cart', () => {
      const count = getTotalItems([]);
      expect(count).toBe(0);
    });

    it('should sum quantities', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 3,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 6000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 6000,
          quantity: 2,
        },
      ];

      const count = getTotalItems(cart);
      expect(count).toBe(5);
    });
  });

  describe('validateCartItems', () => {
    it('should validate correct cart items', () => {
      const items = [
        {
          id: 'dish-1',
          name: 'Test Dish',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish',
          unitPrice: 5000,
          quantity: 1,
        },
      ];

      const result = validateCartItems(items);
      expect(result).toHaveLength(1);
    });

    it('should filter out invalid items', () => {
      const items = [
        {
          id: 'dish-1',
          name: 'Test Dish',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Test Restaurant',
          dishId: 'dish-1',
          dishName: 'Test Dish',
          unitPrice: 5000,
          quantity: 1,
        },
        {
          id: 'dish-2',
          // Nous omettons volontairement les champs requis
          name: 'Invalid Dish',
        },
      ];

      const result = validateCartItems(items as any);
      expect(result).toHaveLength(1);
      expect(result[0].dishId).toBe('dish-1');
    });
  });

  describe('groupCartByRestaurant', () => {
    it('should group single restaurant items correctly', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 2,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 3000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 3000,
          quantity: 1,
        },
      ];

      const groups = groupCartByRestaurant(cart);
      expect(groups).toHaveLength(1);
      expect(groups[0].restaurantId).toBe('rest-1');
      expect(groups[0].restaurantName).toBe('Pizza Place');
      expect(groups[0].items).toHaveLength(2);
      expect(groups[0].itemCount).toBe(3);
      expect(groups[0].subtotal).toBe(13000);
    });

    it('should group multiple restaurants correctly', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 1,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 4000,
          restaurantId: 'rest-2',
          restaurantName: 'Burger Place',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 4000,
          quantity: 2,
        },
      ];

      const groups = groupCartByRestaurant(cart);
      expect(groups).toHaveLength(2);
      expect(groups[0].restaurantId).toBe('rest-1');
      expect(groups[0].subtotal).toBe(5000);
      expect(groups[1].restaurantId).toBe('rest-2');
      expect(groups[1].subtotal).toBe(8000);
    });

    it('should return empty array for empty cart', () => {
      const groups = groupCartByRestaurant([]);
      expect(groups).toHaveLength(0);
    });
  });

  describe('getCartSummary', () => {
    it('should return summary with single restaurant', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-1',
          dishName: 'Test Dish',
          unitPrice: 5000,
          quantity: 2,
        },
      ];

      const summary = getCartSummary(cart);
      expect(summary.groups).toHaveLength(1);
      expect(summary.totalRestaurants).toBe(1);
      expect(summary.totalItems).toBe(2);
      expect(summary.subtotal).toBe(10000);
      expect(summary.canMultiOrder).toBe(false);
    });

    it('should return summary with multiple restaurants', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 1,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 4000,
          restaurantId: 'rest-2',
          restaurantName: 'Burger Place',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 4000,
          quantity: 2,
        },
      ];

      const summary = getCartSummary(cart);
      expect(summary.groups).toHaveLength(2);
      expect(summary.totalRestaurants).toBe(2);
      expect(summary.totalItems).toBe(3);
      expect(summary.subtotal).toBe(13000);
      expect(summary.canMultiOrder).toBe(true);
    });
  });

  describe('getRestaurantSubtotals', () => {
    it('should calculate subtotal for single restaurant', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 2,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 3000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 3000,
          quantity: 1,
        },
      ];

      const subtotals = getRestaurantSubtotals(cart);
      expect(subtotals['rest-1']).toBe(13000);
    });

    it('should calculate subtotals for multiple restaurants', () => {
      const cart: CartItem[] = [
        {
          id: 'dish-1',
          name: 'Test Dish 1',
          price: 5000,
          restaurantId: 'rest-1',
          restaurantName: 'Pizza Place',
          dishId: 'dish-1',
          dishName: 'Test Dish 1',
          unitPrice: 5000,
          quantity: 1,
        },
        {
          id: 'dish-2',
          name: 'Test Dish 2',
          price: 4000,
          restaurantId: 'rest-2',
          restaurantName: 'Burger Place',
          dishId: 'dish-2',
          dishName: 'Test Dish 2',
          unitPrice: 4000,
          quantity: 2,
        },
      ];

      const subtotals = getRestaurantSubtotals(cart);
      expect(subtotals['rest-1']).toBe(5000);
      expect(subtotals['rest-2']).toBe(8000);
    });

    it('should return empty object for empty cart', () => {
      const subtotals = getRestaurantSubtotals([]);
      expect(Object.keys(subtotals)).toHaveLength(0);
    });
  });
});
