package com.buy01.order.controller;

import com.buy01.order.dto.OrderRequest;
import com.buy01.order.dto.OrderResponse;
import com.buy01.order.model.OrderStatus;
import com.buy01.order.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ═══════════════════════════════════════════════
    // CLIENT endpoints
    // ═══════════════════════════════════════════════

    /** POST /api/v1/orders — Create a new order */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication) {

        String userId = (String) authentication.getCredentials();
        OrderResponse created = orderService.createOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/v1/orders/my — Get current user's orders (search + status filter)
     */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Authentication authentication) {

        String userId = (String) authentication.getCredentials();
        return ResponseEntity.ok(orderService.getOrdersByUser(userId, status, search));
    }

    /** GET /api/v1/orders/{orderId} — Get a specific order (owner only) */
    @GetMapping("/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOrderById(
            @PathVariable String orderId,
            Authentication authentication) {

        String userId = (String) authentication.getCredentials();
        return orderService.getOrderById(orderId)
                .map(order -> {
                    if (!order.getUserId().equals(userId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).<OrderResponse>build();
                    }
                    return ResponseEntity.ok(order);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** PATCH /api/v1/orders/{orderId}/cancel — Cancel an order */
    @PatchMapping("/{orderId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> cancelOrder(
            @PathVariable String orderId,
            Authentication authentication) {

        String userId = (String) authentication.getCredentials();
        try {
            return orderService.cancelOrder(orderId, userId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/v1/orders/{orderId}/redo — Re-order (create new order from
     * existing)
     */
    @PostMapping("/{orderId}/redo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> reOrder(
            @PathVariable String orderId,
            Authentication authentication) {

        String userId = (String) authentication.getCredentials();
        try {
            OrderResponse created = orderService.reOrder(orderId, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /** DELETE /api/v1/orders/{orderId} — Delete an order permanently */
    @DeleteMapping("/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteOrder(
            @PathVariable String orderId,
            Authentication authentication) {

        String userId = (String) authentication.getCredentials();
        try {
            boolean deleted = orderService.deleteOrder(orderId, userId);
            if (!deleted)
                return ResponseEntity.notFound().build();
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/v1/orders/stats/spent — Total spent by current user */
    @GetMapping("/stats/spent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Double>> getTotalSpent(Authentication authentication) {
        String userId = (String) authentication.getCredentials();
        double total = orderService.getTotalSpentByUser(userId);
        return ResponseEntity.ok(Map.of("totalSpent", total));
    }

    // ═══════════════════════════════════════════════
    // SELLER endpoints
    // ═══════════════════════════════════════════════

    /**
     * GET /api/v1/orders/seller/my
     * List all orders containing the seller's products. Supports ?status= and
     * ?search=
     */
    @GetMapping("/seller/my")
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public ResponseEntity<List<OrderResponse>> getSellerOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Authentication authentication) {

        String sellerId = (String) authentication.getCredentials();
        return ResponseEntity.ok(orderService.getOrdersBySeller(sellerId, status, search));
    }

    /**
     * GET /api/v1/orders/seller/stats
     * Seller stats: total earned, top products, order counts by status.
     */
    @GetMapping("/seller/stats")
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public ResponseEntity<Map<String, Object>> getSellerStats(Authentication authentication) {
        String sellerId = (String) authentication.getCredentials();
        return ResponseEntity.ok(orderService.getSellerStats(sellerId));
    }

    // ═══════════════════════════════════════════════
    // ADMIN / SELLER — status management
    // ═══════════════════════════════════════════════

    /**
     * PATCH /api/v1/orders/{orderId}/status
     * Update order status (SELLER or ADMIN only). Body: { "status": "CONFIRMED" }
     */
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public ResponseEntity<?> updateStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> body) {

        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        try {
            OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
            
            return orderService.updateOrderStatus(orderId, newStatus)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
        }
    }
}
