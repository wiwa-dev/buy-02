package com.buy01.order.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document("orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    private String id;

    private String userId;

    private List<OrderItem> items;

    private OrderStatus status;

    private Double totalAmount;

    // "pay_on_delivery" for now
    private String paymentMethod;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
