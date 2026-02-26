package com.buy01.order.service;

import com.buy01.order.dto.OrderItemDto;
import com.buy01.order.dto.OrderRequest;
import com.buy01.order.dto.OrderResponse;
import com.buy01.order.model.Order;
import com.buy01.order.model.OrderItem;
import com.buy01.order.model.OrderStatus;
import com.buy01.order.product.ProductClient;
import com.buy01.order.repository.OrderRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;

    // ─────────────────────────────────────────────────────
    // USER endpoints
    // ─────────────────────────────────────────────────────

    /** Create a new order for a user. */
    public OrderResponse createOrder(String userId, OrderRequest request) {
        List<OrderItem> items = request.getItems().stream()
                .map(dto -> new OrderItem(
                        dto.getProductId(),
                        dto.getProductName(),
                        dto.getSellerId(),
                        dto.getPrice(),
                        dto.getQuantity()))
                .collect(Collectors.toList());

        double total = items.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        Order order = new Order();
        order.setUserId(userId);
        order.setItems(items);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(total);
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "pay_on_delivery");
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        return toResponse(orderRepository.save(order));
    }

    /** Re-order: create a new PENDING order from a cancelled/delivered one. */
    public OrderResponse reOrder(String orderId, String userId) {
        Order original = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        if (!original.getUserId().equals(userId)) {
            throw new SecurityException("Not authorized to redo this order");
        }

        Order newOrder = new Order();
        newOrder.setUserId(userId);
        newOrder.setItems(original.getItems());
        newOrder.setStatus(OrderStatus.PENDING);
        newOrder.setTotalAmount(original.getTotalAmount());
        newOrder.setPaymentMethod(original.getPaymentMethod());
        newOrder.setCreatedAt(LocalDateTime.now());
        newOrder.setUpdatedAt(LocalDateTime.now());

        return toResponse(orderRepository.save(newOrder));
    }

    /**
     * Get all orders for a specific user, with optional status filter and search.
     */
    public List<OrderResponse> getOrdersByUser(String userId, String status, String search) {
        List<Order> orders;

        if (status != null && !status.isBlank()) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orders = orderRepository.findAllByUserIdAndStatus(userId, orderStatus);
            } catch (IllegalArgumentException e) {
                orders = orderRepository.findAllByUserId(userId);
            }
        } else {
            orders = orderRepository.findAllByUserId(userId);
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            orders = orders.stream()
                    .filter(o -> o.getItems().stream()
                            .anyMatch(item -> item.getProductName().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        return orders.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Simplified get without filters (backward compat). */
    public List<OrderResponse> getOrdersByUser(String userId) {
        return getOrdersByUser(userId, null, null);
    }

    /** Get a single order by ID. */
    public Optional<OrderResponse> getOrderById(String orderId) {
        return orderRepository.findById(orderId).map(this::toResponse);
    }

    /** Cancel an order (set status to CANCELLED). */
    public Optional<OrderResponse> cancelOrder(String orderId, String userId) {
        return orderRepository.findById(orderId).map(order -> {
            if (!order.getUserId().equals(userId)) {
                throw new SecurityException("Not authorized to cancel this order");
            }
            if (order.getStatus() == OrderStatus.DELIVERED) {
                throw new IllegalStateException("Cannot cancel a delivered order");
            }
            order.setStatus(OrderStatus.CANCELLED);
            order.setUpdatedAt(LocalDateTime.now());
            return toResponse(orderRepository.save(order));
        });
    }

    /** Delete an order permanently. */
    public boolean deleteOrder(String orderId, String userId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty())
            return false;
        Order order = orderOpt.get();
        if (!order.getUserId().equals(userId)) {
            throw new SecurityException("Not authorized to delete this order");
        }
        orderRepository.deleteById(orderId);
        return true;
    }

    /** Get total amount spent by a user (excluding cancelled). */
    public double getTotalSpentByUser(String userId) {
        return orderRepository.findAllByUserId(userId).stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .mapToDouble(Order::getTotalAmount)
                .sum();
    }

    // ─────────────────────────────────────────────────────
    // SELLER endpoints
    // ─────────────────────────────────────────────────────

    /**
     * Get all orders that contain at least one product belonging to the seller.
     * Supports optional status filter and keyword search on product names.
     */
    public List<OrderResponse> getOrdersBySeller(String sellerId, String status, String search) {
        List<Order> orders;

        if (status != null && !status.isBlank()) {
            try {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orders = orderRepository.findAllBySellerIdAndStatus(sellerId, orderStatus);
            } catch (IllegalArgumentException e) {
                orders = orderRepository.findAllBySellerId(sellerId);
            }
        } else {
            orders = orderRepository.findAllBySellerId(sellerId);
        }

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            orders = orders.stream()
                    .filter(o -> o.getItems().stream()
                            .filter(item -> sellerId.equals(item.getSellerId()))
                            .anyMatch(item -> item.getProductName().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        return orders.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Seller stats: total earned, orders count, top selling products.
     */
    public Map<String, Object> getSellerStats(String sellerId) {
        List<Order> orders = orderRepository.findAllBySellerId(sellerId);

        // Total revenue (only confirmed/delivered orders)
        double totalEarned = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED || o.getStatus() == OrderStatus.DELIVERED)
                .flatMap(o -> o.getItems().stream())
                .filter(item -> sellerId.equals(item.getSellerId()))
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        // Count by status
        long pendingCount = orders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count();
        long confirmedCount = orders.stream().filter(o -> o.getStatus() == OrderStatus.CONFIRMED).count();
        long deliveredCount = orders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count();
        long cancelledCount = orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();

        // Top selling products (by this seller)
        Map<String, long[]> productMap = new java.util.HashMap<>();
        orders.stream()
                .flatMap(o -> o.getItems().stream())
                .filter(item -> sellerId.equals(item.getSellerId()))
                .forEach(item -> {
                    productMap.computeIfAbsent(item.getProductName(), k -> new long[] { 0, 0 });
                    productMap.get(item.getProductName())[0] += item.getQuantity();
                    productMap.get(item.getProductName())[1] += (long) (item.getPrice() * item.getQuantity());
                });

        List<Map<String, Object>> topProducts = productMap.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> Map.<String, Object>of(
                        "name", e.getKey(),
                        "quantity", e.getValue()[0],
                        "revenue", e.getValue()[1]))
                .collect(Collectors.toList());

        return Map.of(
                "totalEarned", totalEarned,
                "totalOrders", (long) orders.size(),
                "pendingOrders", pendingCount,
                "confirmedOrders", confirmedCount,
                "deliveredOrders", deliveredCount,
                "cancelledOrders", cancelledCount,
                "topProducts", topProducts);
    }

    // ─────────────────────────────────────────────────────
    // ADMIN / SELLER — status update
    // ─────────────────────────────────────────────────────

    /**
     * Update order status (seller/admin action). When status = DELIVERED, decrement
     * product stocks.
     */
    public Optional<OrderResponse> updateOrderStatus(String orderId, OrderStatus newStatus) {
        return orderRepository.findById(orderId).map(order -> {
            OrderStatus previousStatus = order.getStatus();
            order.setStatus(newStatus);
            order.setUpdatedAt(LocalDateTime.now());
            Order saved = orderRepository.save(order);

            // 📦 Decrement stock only on first transition to DELIVERED
            if (newStatus == OrderStatus.DELIVERED && previousStatus != OrderStatus.DELIVERED) {
                System.out.println("newStatus: " + newStatus);
                System.out.println("previousStatus: " + previousStatus);
                for (OrderItem item : order.getItems()) {
                    try {
                        productClient.adjustQuantity(item.getProductId(), -item.getQuantity());
                        log.info("✅ Stock decremented for product {} by {}", item.getProductId(), item.getQuantity());
                    } catch (FeignException e) {
                        log.warn("⚠️ Could not decrement stock for product {}: {}", item.getProductId(),
                                e.getMessage());
                        // Non-blocking: order status is still updated
                    }
                }
            }

            return toResponse(saved);
        });
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    private OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getItems(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}
