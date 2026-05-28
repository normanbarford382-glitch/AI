import { useCartStore } from '@/lib/store';
import type { CartItem } from '@/lib/store';

export function useCart() {
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCartStore();

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total: total(),
    itemCount: itemCount(),
    isEmpty: items.length === 0,
  };
}
