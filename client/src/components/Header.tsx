import { useEffect, useState } from 'react';
import {
  Bell,
  Box,
  ChevronDown,
  Heart,
  LogOut,
  MessageSquare,
  Package,
  User,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Profile = {
  full_name: string;
  is_buyer: boolean;
  is_seller: boolean;
};

type NotificationItem = {
  id: string;
  booking_id: string | null;
  rfq_quote_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const isSellerSide = window.location.pathname.startsWith('/seller');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!supabase) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setProfile(null);
        }
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, is_buyer, is_seller')
        .eq('id', user.id)
        .single();

      if (isMounted) {
        setProfile(data);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const response = await fetch(`${apiUrl}/api/bookings/notifications/count`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const result = (await response.json()) as { count?: number };

          if (isMounted) {
            setNotificationCount(result.count || 0);
          }
        }

        const notificationsResponse = await fetch(`${apiUrl}/api/bookings/notifications`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (notificationsResponse.ok) {
          const result = (await notificationsResponse.json()) as {
            notifications?: NotificationItem[];
          };

          if (isMounted) {
            setNotifications(result.notifications || []);
          }
        }
      }
    }

    void loadProfile();

    const {
      data: { subscription },
    } =
      supabase?.auth.onAuthStateChange(() => {
        void loadProfile();
      }) ?? { data: { subscription: null } };

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [apiUrl]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setProfile(null);
    setIsProfileOpen(false);
    window.location.assign('/');
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!supabase) {
      window.location.assign('/orders');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await fetch(`${apiUrl}/api/bookings/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    }

    window.location.assign(notification.rfq_quote_id ? '/seller/rfq' : '/orders');
  }

  return (
    <header className="site-header">
      <a className="brand" href="/">
        <span>Equip</span>
        <span>ara</span>
      </a>

      <nav className="main-nav" aria-label="Main navigation">
        <a href="/rent-purchase">Rent/Purchase new</a>
        <a href="/sell">Sell Equipments/Transport</a>
      </nav>

      {profile && (
        <nav className="user-shortcuts" aria-label="User shortcuts">
          <button
            className="notification-link"
            aria-expanded={isNotificationsOpen}
            aria-label="Notifications"
            type="button"
            onClick={() => {
              setIsNotificationsOpen((isOpen) => !isOpen);
              setIsProfileOpen(false);
            }}
          >
            <Bell aria-hidden="true" />
            {notificationCount > 0 && <span>{notificationCount}</span>}
          </button>
          <a aria-label="Messages" href="/messages">
            <MessageSquare aria-hidden="true" />
          </a>
          <a aria-label="Saved items" href="/saved">
            <Heart aria-hidden="true" />
          </a>
          <a aria-label="Requests" href="/requests">
            <MessageSquare aria-hidden="true" />
          </a>
        </nav>
      )}

      {profile && isNotificationsOpen && (
        <div className="header-notifications" role="menu">
          <h2>Notifications</h2>
          {notifications.length === 0 && <p>No notifications yet.</p>}
          {notifications.map((notification) => (
            <button
              className={notification.is_read ? '' : 'unread'}
              key={notification.id}
              type="button"
              onClick={() => void handleNotificationClick(notification)}
            >
              {!notification.is_read && <span className="new-badge">NEW</span>}
              <span className="notification-copy">
                <strong>{notification.message}</strong>
                <small>{formatRelativeTime(notification.created_at)}</small>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="profile-area">
        <button
          aria-expanded={isProfileOpen}
          aria-label="Open profile menu"
          className={`profile-button ${profile ? 'profile-button-active' : ''}`}
          type="button"
          onClick={() => setIsProfileOpen((isOpen) => !isOpen)}
        >
          <span>
            <User aria-hidden="true" />
          </span>
          {profile && <ChevronDown aria-hidden="true" />}
        </button>

        {isProfileOpen && !profile && (
          <div className="profile-menu" role="menu">
            <p>Register or login to access everything</p>
            <a href="/register" role="menuitem">
              Create Account
            </a>
            <a href="/login" role="menuitem">
              Sign In
            </a>
          </div>
        )}

        {isProfileOpen && profile && (
          <div className="profile-menu account-menu" role="menu">
            <div className="account-summary">
              <strong>{profile.full_name}</strong>
              <span>{profile.is_seller ? 'Seller Account' : 'Buyer Account'}</span>
            </div>
            <a href="/account" role="menuitem">
              Account Settings
            </a>
            <a href={profile.is_seller ? '/seller' : '/listings'} role="menuitem">
              <Box aria-hidden="true" />
              My Listings
            </a>
            <a href="/orders" role="menuitem">
              <Package aria-hidden="true" />
              Orders
            </a>
            <a href={isSellerSide ? '/seller/rfq' : '/rfq'} role="menuitem">
              <Package aria-hidden="true" />
              {isSellerSide ? 'RFQ' : 'Ask for Quota'}
            </a>
            <a
              className="seller-switch"
              href={isSellerSide ? '/' : profile.is_seller ? '/seller' : '/become-seller'}
              role="menuitem"
            >
              {isSellerSide ? 'Switch to Buyer' : 'Switch to Seller'}
            </a>
            <button className="sign-out-button" type="button" onClick={handleSignOut}>
              <LogOut aria-hidden="true" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}
