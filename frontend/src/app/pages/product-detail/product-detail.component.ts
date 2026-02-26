import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductInfo } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail.component',
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  productInfo: ProductInfo | null = null;
  currentImageIndex = 0;
  loading = true;
  isDarkMode = false;
  addedToCart = false;
  selectedQuantity = 1;

  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private cartService = inject(CartService);

  ngOnInit(): void {
    this.themeService.darkMode$.subscribe((isDark) => {
      this.isDarkMode = isDark;
    });
    this.route.params.subscribe((params) => {
      const productId = params['id'];
      this.loadProduct(productId);
    });
  }

  loadProduct(productId: string): void {
    this.productService.products$.subscribe({
      next: (products) => {
        this.productInfo = products.find(product => product.product.id == productId) ?? null;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        err.status == 401 ? this.authService.logout() : null;
      },
    });
  }

  nextImage() {
    if (this.productInfo?.medias) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.productInfo.medias.length;
    }
  }

  prevImage(): void {
    if (this.productInfo?.medias) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.productInfo.medias.length) % this.productInfo.medias.length;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  addToCart(): void {
    if (!this.productInfo) return;

    const imageUrl = this.productInfo.medias?.[0]?.imagePath;

    this.cartService.addItem({
      productId: this.productInfo.product.id,
      productName: this.productInfo.product.name,
      sellerId: this.productInfo.seller.id,   // linked to seller for stats
      price: this.productInfo.product.price,
      quantity: this.selectedQuantity,
      imageUrl: imageUrl,
      maxQuantity: this.productInfo.product.quantity
    });

    this.addedToCart = true;
    setTimeout(() => (this.addedToCart = false), 2500);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}




