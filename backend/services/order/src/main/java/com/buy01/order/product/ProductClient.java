package com.buy01.order.product;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client for the product-service.
 * Used to decrement stock when an order is marked as DELIVERED.
 */
@FeignClient(name = "product-service", url = "${application.config.product-url}")
public interface ProductClient {

    /**
     * Adjust the stock of a product by a delta value.
     * delta < 0 → decrement (e.g., delta = -3 removes 3 units)
     * delta > 0 → increment
     */
    @PutMapping("/{productId}/quantity")
    void adjustQuantity(@PathVariable("productId") String productId,
            @RequestParam("delta") int delta);
}
