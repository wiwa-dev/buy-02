package com.buy01.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotNull(message = "Items cannot be null")
    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItemDto> items;

    // "pay_on_delivery" (default for this project)
    private String paymentMethod = "pay_on_delivery";
}
