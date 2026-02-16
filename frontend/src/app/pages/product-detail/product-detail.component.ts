import { Component ,inject, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductInfo } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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

private productService = inject(ProductService);
private route = inject(ActivatedRoute);
private router = inject(Router);
private authService = inject(AuthService);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const productId = params['id'];
      this.loadProduct(productId);
    });
  }

  loadProduct(productId: string): void {
    this.productService.getProductById(productId).subscribe({
      next: (productInfo) => {
        this.productInfo = productInfo;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        err.status == 401 ? this.authService.logout() : null;
      },
    });
  }

  nextImage(){
    if(this.productInfo?.medias){
      this.currentImageIndex = (this.currentImageIndex + 1) % this.productInfo.medias.length;
    }
  }

  prevImage(): void{
    if(this.productInfo?.medias){
      this.currentImageIndex = (this.currentImageIndex - 1 + this.productInfo.medias.length) % this.productInfo.medias.length;
    }
  }
  selectImage(index: number): void{
    this.currentImageIndex = index
  }

   addToCart(): void {
    alert(`"${this.productInfo?.product.name}" ajouté au panier !`);
  }
  goBack(): void {
    this.router.navigate(['/products']);
  }
}



