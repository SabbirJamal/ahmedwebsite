import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ListingDetailPage } from './pages/listing/ListingDetailPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { RfqPage } from './pages/rfq/RfqPage';
import { SearchPage } from './pages/search/SearchPage';
import { BecomeSellerPage } from './pages/seller/BecomeSellerPage';
import { SellerPage } from './pages/seller/SellerPage';
import { AddFleetItemPage } from './pages/seller/seller-add-item/AddFleetItemPage';
import { SellerRfqPage } from './pages/seller/seller-rfq/SellerRfqPage';

export function App() {
  const pathname = window.location.pathname;

  if (pathname === '/login') {
    return <LoginPage />;
  }

  if (pathname === '/register') {
    return <RegisterPage />;
  }

  if (pathname === '/become-seller') {
    return <BecomeSellerPage />;
  }

  if (pathname === '/search') {
    return <SearchPage />;
  }

  if (pathname === '/orders' || pathname === '/seller/orders') {
    return <OrdersPage />;
  }

  if (pathname === '/rfq') {
    return <RfqPage />;
  }

  if (pathname.startsWith('/listing/')) {
    return <ListingDetailPage listingId={pathname.replace('/listing/', '')} />;
  }

  if (pathname === '/seller') {
    return <SellerPage />;
  }

  if (pathname === '/seller/add-item') {
    return <AddFleetItemPage />;
  }

  if (pathname === '/seller/rfq') {
    return <SellerRfqPage />;
  }

  return <HomePage />;
}
