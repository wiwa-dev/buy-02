import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { ProductService } from "../../services/product.service";
import { AuthService } from "../../services/auth.service";
import { ThemeService } from "../../services/theme.service";
import { FormsModule } from '@angular/forms';
import {ProductInfo } from "../../models/product.model";
import { User } from "../../models/user.model";
@Component({
  selector: "app-products-list",
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./products-list.component.html",
})
export class ProductsListComponent implements OnInit {
  productInfos: ProductInfo[] = [];
  filteredProducts: ProductInfo[] = [];
  query = '';
  loading = true;
  currentUser: User | null = null;
  isDarkMode = false;
  searchQuery = '';

  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  ngOnInit(): void {
    
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.themeService.darkMode$.subscribe((isDark) => {
      this.isDarkMode = isDark;
    });
    this.productService.loadProducts();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.products$.subscribe({
      next: (ProductInfo) => {
        console.log(ProductInfo);

        this.productInfos = ProductInfo;
        this.filteredProducts = ProductInfo;
        // console.log(this.productInfos[0].medias[0]);

        this.loading = false;
        
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        err.status == 401 ? this.authService.logout() : null;
      },
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }

  onSearch(): void {
     this.query = this.searchQuery.toLowerCase() ;
    if (!this.searchQuery.trim()) {
      this.filteredProducts = this.productInfos;
      return;
    }

    this.filteredProducts = this.productInfos.filter(productInfo =>
      productInfo.product.name.toLowerCase().includes(this.query) ||
      productInfo.product.description.toLowerCase().includes(this.query) ||
      productInfo.seller.firstName.toLowerCase().includes(this.query) ||
      productInfo.seller.lastName.toLowerCase().includes(this.query) ||
      productInfo.seller.email.toLowerCase().includes(this.query)
    );
  }
  navigateToDashboard(): void {
    this.router.navigate(["/dashboard"]);
  }
}
