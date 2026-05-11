import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, CalendarDays, MapPin, Phone, User } from 'lucide-react';
import { Header } from '../../components/Header';
import { apiFetch } from '../../lib/api';
import { supabase } from '../../lib/supabase';

type OrderStatus =
  | 'active'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'delivered'
  | 'buyer_completed'
  | 'completed';

type OrderAction = 'accept' | 'reject' | 'delivered' | 'buyer_completed' | 'completed';

type Order = {
  id: string;
  start_date: string;
  end_date: string;
  pickup_location: string;
  notes: string | null;
  status: OrderStatus;
  created_at: string;
  fleet_listings?: {
    name?: string;
    photos?: string[];
    brand?: string;
    model?: string;
  };
  profiles?: {
    full_name?: string;
    phone?: string;
  };
  seller_profiles?: {
    company_name?: string;
    phone?: string;
    location_city?: string;
  };
};

export function OrdersPage() {
  const [activeView, setActiveView] = useState<'my' | 'incoming'>('incoming');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [activeBucket, setActiveBucket] = useState<'pending' | 'history'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      setIsLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.assign('/login');
      return;
    }

    try {
      const response = await apiFetch('/api/bookings/orders', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = (await response.json()) as {
        incomingOrders?: Order[];
        myOrders?: Order[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message || 'Could not load orders.');
      }

      setIncomingOrders(result.incomingOrders || []);
      setMyOrders(result.myOrders || []);

      if ((result.incomingOrders || []).length === 0 && (result.myOrders || []).length > 0) {
        setActiveView('my');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not load orders.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateOrderStatus(orderId: string, action: OrderAction) {
    if (!supabase) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.assign('/login');
      return;
    }

    setErrorMessage('');

    try {
      const response = await apiFetch(`/api/bookings/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as {
        order?: { id: string; status: OrderStatus };
        message?: string;
      };

      if (!response.ok || !result.order) {
        throw new Error(result.message || 'Could not update order.');
      }

      const applyStatus = (orders: Order[]) =>
        orders.map((order) =>
          order.id === result.order?.id
            ? { ...order, status: result.order.status }
            : order,
        );

      setIncomingOrders(applyStatus);
      setMyOrders(applyStatus);
      void loadOrders();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update order.',
      );
    }
  }

  const pendingIncoming = useMemo(
    () =>
      incomingOrders.filter(
        (order) => order.status !== 'completed' && order.status !== 'rejected',
      ),
    [incomingOrders],
  );
  const incomingHistory = useMemo(
    () =>
      incomingOrders.filter(
        (order) => order.status === 'completed' || order.status === 'rejected',
      ),
    [incomingOrders],
  );
  const activeMyOrders = useMemo(
    () =>
      myOrders.filter(
        (order) => order.status !== 'completed' && order.status !== 'rejected',
      ),
    [myOrders],
  );
  const myOrderHistory = useMemo(
    () =>
      myOrders.filter(
        (order) => order.status === 'completed' || order.status === 'rejected',
      ),
    [myOrders],
  );

  const pendingOrders = activeView === 'incoming' ? pendingIncoming : activeMyOrders;
  const historyOrders = activeView === 'incoming' ? incomingHistory : myOrderHistory;
  const visibleOrders = activeBucket === 'pending' ? pendingOrders : historyOrders;
  const historyCount =
    activeView === 'incoming' ? incomingHistory.length : myOrderHistory.length;
  const pendingCount = pendingOrders.length;

  return (
    <main className="app-shell seller-orders-shell">
      <Header />
      <section className="seller-orders-page">
        <div className="seller-orders-heading">
          <h1>
            <Box aria-hidden="true" />
            {activeView === 'incoming' ? 'Incoming Orders' : 'My Orders'}
          </h1>
          <div className="seller-orders-toggle">
            <button
              className={activeView === 'my' ? 'active' : ''}
              type="button"
              onClick={() => {
                setActiveView('my');
                setActiveBucket('pending');
              }}
            >
              My Orders
            </button>
            <button
              className={activeView === 'incoming' ? 'active' : ''}
              type="button"
              onClick={() => {
                setActiveView('incoming');
                setActiveBucket('pending');
              }}
            >
              Incoming Orders
            </button>
          </div>
        </div>

        <div className="seller-order-tabs">
          <button
            className={activeBucket === 'pending' ? 'active' : ''}
            type="button"
            onClick={() => setActiveBucket('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={activeBucket === 'history' ? 'active' : ''}
            type="button"
            onClick={() => setActiveBucket('history')}
          >
            Order History ({historyCount})
          </button>
        </div>

        {errorMessage && <p className="form-message error">{errorMessage}</p>}
        {isLoading && <p className="seller-empty">Loading orders...</p>}
        {!isLoading && visibleOrders.length === 0 && (
          <p className="seller-empty">
            {activeBucket === 'history'
              ? 'No order history yet.'
              : activeView === 'incoming'
                ? 'No incoming orders yet.'
                : 'No active orders yet.'}
          </p>
        )}

        <div className="seller-orders-list">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              view={activeView}
              onAction={updateOrderStatus}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function OrderCard({
  onAction,
  order,
  view,
}: {
  onAction: (orderId: string, action: OrderAction) => void;
  order: Order;
  view: 'my' | 'incoming';
}) {
  const primaryAction = getPrimaryAction(order.status, view);
  const showReject =
    view === 'incoming' && (order.status === 'pending' || order.status === 'active');
  const contactName =
    view === 'incoming'
      ? order.profiles?.full_name || 'Buyer'
      : order.seller_profiles?.company_name || 'Seller';
  const contactPhone =
    view === 'incoming' ? order.profiles?.phone : order.seller_profiles?.phone;

  return (
    <article className="seller-order-card" id={`order-${order.id}`}>
      <div className="seller-order-top">
        <img
          alt={order.fleet_listings?.name || 'Requested item'}
          src={order.fleet_listings?.photos?.[0]}
        />
        <div>
          <h2>{order.fleet_listings?.name || 'Requested item'}</h2>
          <p>
            <CalendarDays aria-hidden="true" />
            {formatDate(order.start_date)} - {formatDate(order.end_date)}
          </p>
        </div>
        <span className={`seller-order-status ${order.status}`}>
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="seller-order-info">
        <span>
          <User aria-hidden="true" />
          {contactName}
        </span>
        <span>
          <Phone aria-hidden="true" />
          {contactPhone || 'No phone'}
        </span>
        <span>
          <MapPin aria-hidden="true" />
          Pickup: {order.pickup_location}
        </span>
      </div>

      {order.notes && <p className="seller-order-notes">"{order.notes}"</p>}

      {(primaryAction || showReject) && (
        <div className="seller-order-actions">
          {primaryAction && (
            <button
              className="order-primary-action"
              type="button"
              onClick={() => onAction(order.id, primaryAction.action)}
            >
              {primaryAction.label}
            </button>
          )}
          {showReject && (
            <button
              className="order-reject-action"
              type="button"
              onClick={() => onAction(order.id, 'reject')}
            >
              Reject
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function getPrimaryAction(status: OrderStatus, view: 'my' | 'incoming') {
  if (view === 'incoming' && (status === 'pending' || status === 'active')) {
    return { action: 'accept' as const, label: 'Accept' };
  }

  if (view === 'incoming' && status === 'accepted') {
    return { action: 'delivered' as const, label: 'Delivered' };
  }

  if (view === 'my' && status === 'delivered') {
    return { action: 'buyer_completed' as const, label: 'Work completed' };
  }

  if (view === 'incoming' && status === 'buyer_completed') {
    return { action: 'completed' as const, label: 'Mark as completed' };
  }

  return null;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatStatus(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    accepted: 'Accepted',
    active: 'Pending',
    buyer_completed: 'Returned',
    completed: 'Completed',
    delivered: 'Delivered',
    pending: 'Pending',
    rejected: 'Rejected',
  };

  return labels[status];
}
