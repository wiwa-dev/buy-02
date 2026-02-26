package com.buy01.product.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import com.buy01.product.repository.ProductRepository;
import com.buy01.product.model.Product;

import java.util.List;
import java.util.Optional;

// test
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public List<Product> findAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> findAllProductsByUserId(String userId) {
        return productRepository.findAllByUserId(userId);
    }

    public Optional<Product> findProductById(String id) {
        return Optional.ofNullable(productRepository.findById(id).orElse(null));
    }

    public Product findProductByUserId(String userId) {
        return productRepository.findByUserId(userId).orElse(null);
    }

    public void deleteProduct(String id) {
        productRepository.deleteById(id);
    }

    public Boolean existsByProductId(String productId) {
        return productRepository.findById(productId).isPresent();
    }

    /**
     * Decrement product stock by a given quantity (called when order is DELIVERED).
     * Throws IllegalStateException if stock is insufficient.
     */
    public Product decrementStock(String productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        int newQty = product.getQuantity() - quantity;
        if (newQty < 0)
            newQty = 0; // floor at 0 to avoid negative stock
        product.setQuantity(newQty);
        return productRepository.save(product);
    }

    /**
     * Update stock to an absolute value (seller replenishment).
     */
    public Product updateStock(String productId, int newQuantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        if (newQuantity < 0)
            throw new IllegalArgumentException("Quantity cannot be negative");
        product.setQuantity(newQuantity);
        return productRepository.save(product);
    }
}
