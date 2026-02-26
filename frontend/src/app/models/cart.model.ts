export interface CartItem {
  productId: string;
  productName: string;
  sellerId?: string;   // ID du vendeur — envoyé à l'order-service pour les stats seller
  price: number;
  quantity: number;
  imageUrl?: string;
  maxQuantity: number; // stock disponible
}

export interface Cart {
  items: CartItem[];
}
