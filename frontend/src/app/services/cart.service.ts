import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly CART_KEY = 'buy02_cart';

    private cartSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
    public cart$ = this.cartSubject.asObservable();

    // ─── Load cart from localStorage ──────────────────────────────────
    private loadFromStorage(): CartItem[] {
        try {
            const raw = localStorage.getItem(this.CART_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private saveToStorage(items: CartItem[]): void {
        localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    }

    // ─── Public API ───────────────────────────────────────────────────
    getItems(): CartItem[] {
        return this.cartSubject.value;
    }

    getItemCount(): number {
        return this.cartSubject.value.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotal(): number {
        return this.cartSubject.value.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }): void {
        const current = this.cartSubject.value;
        const existing = current.find(i => i.productId === item.productId);

        let updated: CartItem[];

        if (existing) {
            // Increase quantity but respect stock limit
            const newQty = Math.min(existing.quantity + (item.quantity ?? 1), item.maxQuantity);
            updated = current.map(i =>
                i.productId === item.productId ? { ...i, quantity: newQty } : i
            );
        } else {
            updated = [...current, { ...item, quantity: item.quantity ?? 1 }];
        }

        this.cartSubject.next(updated);
        this.saveToStorage(updated);
    }

    updateQuantity(productId: string, quantity: number): void {
        const current = this.cartSubject.value;
        let updated: CartItem[];

        if (quantity <= 0) {
            updated = current.filter(i => i.productId !== productId);
        } else {
            updated = current.map(i =>
                i.productId === productId ? { ...i, quantity } : i
            );
        }

        this.cartSubject.next(updated);
        this.saveToStorage(updated);
    }

    removeItem(productId: string): void {
        const updated = this.cartSubject.value.filter(i => i.productId !== productId);
        this.cartSubject.next(updated);
        this.saveToStorage(updated);
    }

    clearCart(): void {
        this.cartSubject.next([]);
        localStorage.removeItem(this.CART_KEY);
    }

    isInCart(productId: string): boolean {
        return this.cartSubject.value.some(i => i.productId === productId);
    }
}
