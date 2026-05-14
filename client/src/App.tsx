import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
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
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<BecomeSellerPage />} path="/become-seller" />
        <Route element={<SearchPage />} path="/search" />
        <Route element={<OrdersPage />} path="/orders" />
        <Route element={<OrdersPage />} path="/seller/orders" />
        <Route element={<RfqPage />} path="/rfq" />
        <Route element={<ListingDetailRoute />} path="/listing/:listingId" />
        <Route element={<SellerPage />} path="/seller" />
        <Route element={<SellerPage />} path="/dashboard" />
        <Route element={<AddFleetItemPage />} path="/seller/add-item" />
        <Route element={<SellerRfqPage />} path="/seller/rfq" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

function ListingDetailRoute() {
  const { listingId = '' } = useParams();

  return <ListingDetailPage listingId={listingId} />;
}
