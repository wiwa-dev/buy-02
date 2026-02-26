export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';

export interface OrderItem {
    productId: string;
    productName: string;
    sellerId?: string;   // ID du vendeur — requis pour les fonctionnalités seller
    price: number;
    quantity: number;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderRequest {
    items: OrderItem[];
    paymentMethod?: string;
}
