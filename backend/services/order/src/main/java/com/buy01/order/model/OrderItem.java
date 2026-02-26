package com.buy01.order.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    private String productId;
    private String productName;
    private String sellerId; // ID du vendeur propriétaire du produit
    private Double price;
    private int quantity;
}
