import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, SellerStats } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { Order } from '../../../models/order.model';

@Component({
    selector: 'app-seller-orders',
    imports: [CommonModule, FormsModule],
    templateUrl: './seller-orders.component.html'
})
export class SellerOrdersComponent implements OnInit {
    orders: Order[] = [];
    stats: SellerStats | null = null;
    loading = true;
    statsLoading = true;
    error = '';

    // Filters
    searchQuery = '';
    statusFilter = '';
    updatingId: string | null = null;

    readonly STATUSES = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];

    private orderService = inject(OrderService);
    private authService = inject(AuthService);

    ngOnInit(): void {
        this.loadStats();
        this.loadOrders();
    }

    loadOrders(): void {
        this.loading = true;
        this.error = '';

        const filters: any = {};
        if (this.statusFilter) filters.status = this.statusFilter;
        if (this.searchQuery.trim()) filters.search = this.searchQuery.trim();

        this.orderService.getSellerOrders(filters).subscribe({
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

    loadStats(): void {
        this.statsLoading = true;
        this.orderService.getSellerStats().subscribe({
            next: (stats) => {
                this.stats = stats;
                this.statsLoading = false;
            },
            error: () => {
                this.statsLoading = false;
            }
        });
    }

    onSearch(): void {
        this.loadOrders();
    }

    onStatusFilterChange(): void {
        this.loadOrders();
    }

    updateStatus(orderId: string, status: string): void {
        console.log(status,"testttt");
        
        this.updatingId = orderId;
        this.orderService.updateOrderStatus(orderId, status).subscribe({
            next: (updated) => {
                this.orders = this.orders.map(o => o.id === orderId ? updated : o);
                this.updatingId = null;
                this.loadStats(); // refresh stats
            },
            error: (err) => {
                console.error(err);
                this.updatingId = null;
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

    getNextStatuses(current: string): string[] {
        const transitions: Record<string, string[]> = {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['DELIVERED', 'CANCELLED'],
            DELIVERED: [],
            CANCELLED: []
        };
        return transitions[current] ?? [];
    }
}
