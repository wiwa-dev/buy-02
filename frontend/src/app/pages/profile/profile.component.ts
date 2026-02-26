import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Order } from '../../models/order.model';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-profile',
    imports: [CommonModule, RouterModule],
    templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
    currentUser: User | null = null;
    orders: Order[] = [];
    totalSpent = 0;
    loading = true;
    isDarkMode = false;

    private orderService = inject(OrderService);
    private authService = inject(AuthService);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    ngOnInit(): void {
        this.themeService.darkMode$.subscribe(isDark => (this.isDarkMode = isDark));
        this.authService.currentUser$.subscribe(user => (this.currentUser = user));

        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        this.loadProfileData();
    }

    loadProfileData(): void {
        this.loading = true;

        this.orderService.getMyOrders().subscribe({
            next: (orders) => {
                this.orders = orders.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                // Calculate locally for instant display
                this.totalSpent = orders
                    .filter(o => o.status !== 'CANCELLED')
                    .reduce((sum, o) => sum + o.totalAmount, 0);
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                if (err.status === 401) this.authService.logout();
            }
        });
    }

    get completedOrders(): Order[] {
        return this.orders.filter(o => o.status === 'DELIVERED');
    }

    get pendingOrders(): Order[] {
        return this.orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED');
    }

    get cancelledOrders(): Order[] {
        return this.orders.filter(o => o.status === 'CANCELLED');
    }

    get mostBoughtProducts(): { name: string; qty: number; total: number }[] {
        const map = new Map<string, { name: string; qty: number; total: number }>();

        this.orders
            .filter(o => o.status !== 'CANCELLED')
            .forEach(o => {
                o.items.forEach(item => {
                    const existing = map.get(item.productId) ?? { name: item.productName, qty: 0, total: 0 };
                    map.set(item.productId, {
                        name: item.productName,
                        qty: existing.qty + item.quantity,
                        total: existing.total + item.price * item.quantity
                    });
                });
            });

        return Array.from(map.values())
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
        };
        return classes[status] ?? 'bg-gray-100 text-gray-600';
    }

    goBack(): void {
        this.router.navigate(['/products']);
    }
}
