import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, CreateOrderRequest } from '../models/order.model';
import { environment } from '../../environments/environment';

export interface SellerStats {
    totalEarned: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly API_URL = `${environment.apiGateway}/orders`;
    private http = inject(HttpClient);

    // ── CLIENT ───────────────────────────────────────────

    /** Create a new order (pay on delivery) */
    createOrder(request: CreateOrderRequest): Observable<Order> {
        return this.http.post<Order>(this.API_URL, request);
    }

    /** Re-order: create a new PENDING copy of an existing order */
    reOrder(orderId: string): Observable<Order> {
        return this.http.post<Order>(`${this.API_URL}/${orderId}/redo`, {});
    }

    /** Get all orders for the logged-in user, with optional filters */
    getMyOrders(filters?: { status?: string; search?: string }): Observable<Order[]> {
        const params: Record<string, string> = {};
        if (filters?.status) params['status'] = filters.status;
        if (filters?.search) params['search'] = filters.search;
        return this.http.get<Order[]>(`${this.API_URL}/my`, { params });
    }

    /** Get a specific order by ID */
    getOrderById(orderId: string): Observable<Order> {
        return this.http.get<Order>(`${this.API_URL}/${orderId}`);
    }

    /** Cancel an order */
    cancelOrder(orderId: string): Observable<Order> {
        return this.http.patch<Order>(`${this.API_URL}/${orderId}/cancel`, {});
    }

    /** Delete an order permanently */
    deleteOrder(orderId: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${orderId}`);
    }

    /** Get total spent by the current user */
    getTotalSpent(): Observable<{ totalSpent: number }> {
        return this.http.get<{ totalSpent: number }>(`${this.API_URL}/stats/spent`);
    }

    // ── SELLER ───────────────────────────────────────────

    /** Get all orders containing the seller's products */
    getSellerOrders(filters?: { status?: string; search?: string }): Observable<Order[]> {
        const params: Record<string, string> = {};
        if (filters?.status) params['status'] = filters.status;
        if (filters?.search) params['search'] = filters.search;
        return this.http.get<Order[]>(`${this.API_URL}/seller/my`, { params });
    }

    /** Get seller stats: total earned, top products, order counts */
    getSellerStats(): Observable<SellerStats> {
        return this.http.get<SellerStats>(`${this.API_URL}/seller/stats`);
    }

    /** Update order status (seller/admin) */
    updateOrderStatus(orderId: string, status: string): Observable<Order> {
        return this.http.put<Order>(`${this.API_URL}/${orderId}/status`, { status });
    }
}
