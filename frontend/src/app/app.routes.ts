import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { SellerGuard } from './guards/seller.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProductsListComponent } from './pages/products-list/products-list.component';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { OverviewComponent } from './pages/dashboard/overview/overview.component';
import { ProductsComponent } from './pages/dashboard/products/products.component';
import { MediaComponent } from './pages/dashboard/media/media.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SellerOrdersComponent } from './pages/dashboard/seller-orders/seller-orders.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/products',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'products',
    component: ProductsListComponent
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard, SellerGuard],
    children: [
      {
        path: '',
        component: OverviewComponent
      },
      {
        path: 'products',
        component: ProductsComponent
      },
      {
        path: 'media',
        component: MediaComponent
      },
      {
        path: 'orders',
        component: SellerOrdersComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/products'
  }
];

