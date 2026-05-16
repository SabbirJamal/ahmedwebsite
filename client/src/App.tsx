import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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
import { supabase } from './lib/supabase';

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
        <Route
          element={
            <ProtectedSellerRoute>
              <OrdersPage />
            </ProtectedSellerRoute>
          }
          path="/seller/orders"
        />
        <Route element={<RfqPage />} path="/rfq" />
        <Route element={<ListingDetailRoute />} path="/listing/:listingId" />
        <Route
          element={
            <ProtectedSellerRoute>
              <SellerPage />
            </ProtectedSellerRoute>
          }
          path="/seller"
        />
        <Route
          element={
            <ProtectedSellerRoute>
              <SellerPage />
            </ProtectedSellerRoute>
          }
          path="/dashboard"
        />
        <Route
          element={
            <ProtectedSellerRoute>
              <AddFleetItemPage />
            </ProtectedSellerRoute>
          }
          path="/seller/add-item"
        />
        <Route
          element={
            <ProtectedSellerRoute>
              <SellerRfqPage />
            </ProtectedSellerRoute>
          }
          path="/seller/rfq"
        />
        <Route element={<TrailingSlashRedirect />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedSellerRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'signed-out' | 'approved' | 'not-approved'>(
    'loading',
  );

  useEffect(() => {
    async function verifySellerAccess() {
      if (!supabase) {
        setStatus('signed-out');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('signed-out');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', user.id)
        .single();

      setStatus(data?.is_seller ? 'approved' : 'not-approved');
    }

    void verifySellerAccess();
  }, []);

  if (status === 'loading') {
    return <p className="seller-empty">Checking seller access...</p>;
  }

  if (status === 'signed-out') {
    return <Navigate replace to="/login" />;
  }

  if (status === 'not-approved') {
    return <Navigate replace to="/become-seller" />;
  }

  return children;
}

function ListingDetailRoute() {
  const { listingId = '' } = useParams();

  return <ListingDetailPage listingId={listingId} />;
}

function TrailingSlashRedirect() {
  const location = useLocation();

  if (location.pathname.length > 1 && location.pathname.endsWith('/')) {
    return (
      <Navigate
        replace
        to={`${location.pathname.replace(/\/+$/, '')}${location.search}${location.hash}`}
      />
    );
  }

  return <Navigate replace to="/" />;
}
