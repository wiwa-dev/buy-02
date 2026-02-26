import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Order } from '../../models/order.model';

@Component({
    selector: 'app-orders',
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
    orders: Order[] = [];
    loading = true;
    error = '';
    cancellingId: string | null = null;
    deletingId: string | null = null;
    redoingId: string | null = null;
    isDarkMode = false;

    // Filters
    searchQuery = '';
    statusFilter = '';
    readonly STATUSES = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];

    private orderService = inject(OrderService);
    private authService = inject(AuthService);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    ngOnInit(): void {
        this.themeService.darkMode$.subscribe(isDark => (this.isDarkMode = isDark));

        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }

        this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.error = '';

        const filters: any = {};
        if (this.statusFilter) filters.status = this.statusFilter;
        if (this.searchQuery.trim()) filters.search = this.searchQuery.trim();

        this.orderService.getMyOrders(filters).subscribe({
            next: (orders) => {
                this.orders = orders.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                if (err.status === 401) this.authService.logout();
                else this.error = 'Failed to load orders.';
            }
        });
    }

    onSearch(): void {
        this.loadOrders();
    }

    onStatusChange(): void {
        this.loadOrders();
    }

    cancelOrder(orderId: string): void {
        this.cancellingId = orderId;
        this.orderService.cancelOrder(orderId).subscribe({
            next: (updated) => {
                this.orders = this.orders.map(o => o.id === orderId ? updated : o);
                this.cancellingId = null;
            },
            error: (err) => {
                console.error(err);
                this.cancellingId = null;
            }
        });
    }

    deleteOrder(orderId: string): void {
        this.deletingId = orderId;
        this.orderService.deleteOrder(orderId).subscribe({
            next: () => {
                this.orders = this.orders.filter(o => o.id !== orderId);
                this.deletingId = null;
            },
            error: (err) => {
                console.error(err);
                this.deletingId = null;
            }
        });
    }

    /** Re-order: creates a new PENDING copy of a cancelled/delivered order */
    reOrder(orderId: string): void {
        this.redoingId = orderId;
        this.orderService.reOrder(orderId).subscribe({
            next: (newOrder) => {
                this.orders = [newOrder, ...this.orders];
                this.redoingId = null;
            },
            error: (err) => {
                console.error(err);
                this.redoingId = null;
            }
        });
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

    canCancel(status: string): boolean {
        return status === 'PENDING' || status === 'CONFIRMED';
    }

    canDelete(status: string): boolean {
        return status === 'CANCELLED';
    }

    canRedo(status: string): boolean {
        return status === 'CANCELLED' || status === 'DELIVERED';
    }

    goBack(): void {
        this.router.navigate(['/products']);
    }
}
