package com.buy01.order.repository;

import com.buy01.order.model.Order;
import com.buy01.order.model.OrderStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {

    // Find all orders for a specific user
    List<Order> findAllByUserId(String userId);

    // Find orders for a user filtered by status
    List<Order> findAllByUserIdAndStatus(String userId, OrderStatus status);

    // Find all orders by status (for admin views)
    List<Order> findAllByStatus(OrderStatus status);

    // Find all orders that contain at least one item from a specific seller
    @Query("{ 'items.sellerId': ?0 }")
    List<Order> findAllBySellerId(String sellerId);

    // Find all orders for a seller filtered by status
    @Query("{ 'items.sellerId': ?0, 'status': ?1 }")
    List<Order> findAllBySellerIdAndStatus(String sellerId, OrderStatus status);
}
