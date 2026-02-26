import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CartItem } from '../../models/cart.model';
import { CreateOrderRequest } from '../../models/order.model';

@Component({
    selector: 'app-cart',
    imports: [CommonModule, RouterModule],
    templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
    items: CartItem[] = [];
    isDarkMode = false;
    isOrdering = false;
    orderSuccess = false;
    orderError = '';

    private cartService = inject(CartService);
    private orderService = inject(OrderService);
    private authService = inject(AuthService);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    ngOnInit(): void {
        this.themeService.darkMode$.subscribe(isDark => (this.isDarkMode = isDark));
        this.cartService.cart$.subscribe(items => (this.items = items));
    }

    get total(): number {
        return this.cartService.getTotal();
    }

    get itemCount(): number {
        return this.cartService.getItemCount();
    }

    updateQuantity(productId: string, quantity: number): void {
        this.cartService.updateQuantity(productId, quantity);
    }

    removeItem(productId: string): void {
        this.cartService.removeItem(productId);
    }

    clearCart(): void {
        this.cartService.clearCart();
    }

    goBack(): void {
        this.router.navigate(['/products']);
    }

    checkout(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        if (this.items.length === 0) return;

        this.isOrdering = true;
        this.orderError = '';

        const request: CreateOrderRequest = {
            items: this.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                sellerId: item.sellerId,   // linked to seller for dashboard stats
                price: item.price,
                quantity: item.quantity
            })),
            paymentMethod: 'pay_on_delivery'
        };

        this.orderService.createOrder(request).subscribe({
            next: () => {
                this.cartService.clearCart();
                this.orderSuccess = true;
                this.isOrdering = false;
                setTimeout(() => this.router.navigate(['/orders']), 2500);
            },
            error: (err) => {
                console.error(err);
                this.isOrdering = false;
                this.orderError = 'Failed to place order. Please try again.';
            }
        });
    }
}
