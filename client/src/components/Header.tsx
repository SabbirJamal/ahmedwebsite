import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Box,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  User,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { fleetTypes } from '../lib/fleet-options';
import { supabase } from '../lib/supabase';

type Profile = {
  full_name: string;
  is_buyer: boolean;
  is_seller: boolean;
};

type AuthUser = {
  email?: string;
  id: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
};

type NotificationItem = {
  id: string;
  booking_id: string | null;
  rfq_quote_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

const menuGroups = [
  {
    title: 'Heavy Equipment',
    items: ['crane', 'excavator', 'loader', 'generator'],
  },
  {
    title: 'Lifts and Handling',
    items: ['forklift', 'reach_stacker', 'boom_lift', 'manlift'],
  },
  {
    title: 'Trailers',
    items: ['flatbed', 'box_trailer', 'lowbed'],
  },
  {
    title: 'Transport Trucks',
    items: ['prime_mover', 'recovery_truck', 'tanker'],
  },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const profileCloseTimer = useRef<number | null>(null);
  const isSellerSide = location.pathname.startsWith('/seller');
  const hasSellerAccess = Boolean(profile?.is_seller);

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
          setAuthUser(null);
          setProfile(null);
        }
        return;
      }

      if (isMounted) {
        setAuthUser(user);
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, is_buyer, is_seller')
        .eq('id', user.id)
        .single();

      if (isMounted) {
        setProfile(profileError ? null : data);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const response = await apiFetch('/api/bookings/notifications/count', {
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

        const notificationsResponse = await apiFetch('/api/bookings/notifications', {
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
  }, []);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setAuthUser(null);
    setProfile(null);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  }

  function openProfileMenu() {
    if (profileCloseTimer.current) {
      window.clearTimeout(profileCloseTimer.current);
      profileCloseTimer.current = null;
    }

    setIsProfileOpen(true);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(false);
  }

  function scheduleProfileMenuClose() {
    if (profileCloseTimer.current) {
      window.clearTimeout(profileCloseTimer.current);
    }

    profileCloseTimer.current = window.setTimeout(() => {
      setIsProfileOpen(false);
      profileCloseTimer.current = null;
    }, 180);
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (!supabase) {
      navigate('/orders');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await apiFetch(`/api/bookings/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    }

    navigate(notification.rfq_quote_id ? '/seller/rfq' : '/orders');
  }

  return (
    <header className={`site-header ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <Link className="brand" to="/">
        <span>Trex</span>
        <span>-O</span>
      </Link>

      <button
        aria-expanded={isMobileMenuOpen}
        aria-label="Open navigation menu"
        className="mobile-menu-button"
        type="button"
        onClick={() => {
          setIsMobileMenuOpen((isOpen) => !isOpen);
          setIsNotificationsOpen(false);
          setIsProfileOpen(false);
        }}
      >
        {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      <nav className="main-nav" aria-label="Main navigation">
        <div className="nav-mega-item">
          <Link
            className="nav-pill"
            to="/search"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Equipment Rentals
            <ChevronDown aria-hidden="true" />
          </Link>
          <div className="mega-menu">
            {menuGroups.map((group) => (
              <div className="mega-column" key={group.title}>
                <h2>{group.title}</h2>
                {group.items.map((value) => {
                  const item = fleetTypes.find((fleetType) => fleetType.value === value);

                  if (!item) {
                    return null;
                  }

                  return (
                    <Link
                      className="mega-link"
                      key={item.value}
                      to={`/search?category=${item.category}&type=${item.value}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{item.label.slice(0, 2).toUpperCase()}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {!authUser && (
          <SellerMarketingMenu
            label="List Your Equipment"
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        )}
        {authUser && !hasSellerAccess && (
          <SellerMarketingMenu
            label="Become a Seller"
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        )}
        {authUser && hasSellerAccess && (
          <>
            <Link
              className="nav-list-link"
              to="/seller"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Seller Dashboard
            </Link>
            <Link
              className="nav-list-link"
              to="/seller/rfq"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              RFQs
            </Link>
          </>
        )}
        <div className="sales-contact">
          <strong>Sales: +968 9121 3141</strong>
          <span>Support: +968 9121 3141</span>
        </div>
      </nav>

      {authUser && (
        <nav className="user-shortcuts" aria-label="User shortcuts">
          <button
            className="notification-link"
            aria-expanded={isNotificationsOpen}
            aria-label="Notifications"
            type="button"
            onClick={() => {
              setIsNotificationsOpen((isOpen) => !isOpen);
              setIsProfileOpen(false);
              setIsMobileMenuOpen(false);
            }}
          >
            <Bell aria-hidden="true" />
            {notificationCount > 0 && <span>{notificationCount}</span>}
          </button>
          <Link aria-label="Messages" to="/messages">
            <MessageSquare aria-hidden="true" />
          </Link>
          <Link aria-label="Saved items" to="/saved">
            <Heart aria-hidden="true" />
          </Link>
          <Link aria-label="Requests" to="/requests">
            <MessageSquare aria-hidden="true" />
          </Link>
        </nav>
      )}

      {authUser && isNotificationsOpen && (
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

      <div
        className="profile-area"
        onMouseEnter={openProfileMenu}
        onMouseLeave={scheduleProfileMenuClose}
      >
        <button
          aria-expanded={isProfileOpen}
          aria-label="Open profile menu"
          className={`profile-button ${authUser ? 'profile-button-active' : ''}`}
          type="button"
          onClick={() => {
            setIsProfileOpen((isOpen) => !isOpen);
            setIsNotificationsOpen(false);
            setIsMobileMenuOpen(false);
          }}
          onFocus={() => {
            openProfileMenu();
          }}
        >
          <span>
            <User aria-hidden="true" />
          </span>
          {authUser && <ChevronDown aria-hidden="true" />}
        </button>

        {isProfileOpen && !authUser && (
          <div className="profile-menu" role="menu">
            <p>Register or login to access everything</p>
            <Link role="menuitem" to="/register" onClick={() => setIsProfileOpen(false)}>
              Create Account
            </Link>
            <Link role="menuitem" to="/login" onClick={() => setIsProfileOpen(false)}>
              Sign In
            </Link>
          </div>
        )}

        {isProfileOpen && authUser && (
          <div className="profile-menu account-menu" role="menu">
            <div className="account-summary">
              <strong>{profile?.full_name || getFallbackName(authUser)}</strong>
              <span>{isSellerSide ? 'Seller Account' : 'Buyer Account'}</span>
            </div>
            <Link role="menuitem" to="/account" onClick={() => setIsProfileOpen(false)}>
              Account Settings
            </Link>
            <Link
              role="menuitem"
              to={profile?.is_seller ? '/seller' : '/listings'}
              onClick={() => setIsProfileOpen(false)}
            >
              <Box aria-hidden="true" />
              My Listings
            </Link>
            <Link role="menuitem" to="/orders" onClick={() => setIsProfileOpen(false)}>
              <Package aria-hidden="true" />
              Orders
            </Link>
            <Link
              role="menuitem"
              to={isSellerSide ? '/seller/rfq' : '/rfq'}
              onClick={() => setIsProfileOpen(false)}
            >
              <Package aria-hidden="true" />
              {isSellerSide ? 'RFQ' : 'Ask for Quota'}
            </Link>
            <Link
              className="seller-switch"
              role="menuitem"
              to={isSellerSide ? '/' : profile?.is_seller ? '/seller' : '/become-seller'}
              onClick={() => setIsProfileOpen(false)}
            >
              {isSellerSide ? 'Switch to Buyer' : 'Switch to Seller'}
            </Link>
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

function SellerMarketingMenu({
  label,
  onNavigate,
}: {
  label: string;
  onNavigate: () => void;
}) {
  return (
    <div className="nav-seller-item">
      <Link className="nav-list-link" to="/become-seller" onClick={onNavigate}>
        {label}
        <ChevronDown aria-hidden="true" />
      </Link>
      <div className="seller-mega-menu">
        <div className="seller-mega-intro">
          <h2>Products for rental companies</h2>
          <p>
            Bring your fleet online, receive qualified rental requests, and compete
            for RFQs from construction buyers.
          </p>
        </div>
        <article>
          <div className="seller-mega-visual">
            <span>LIST</span>
            <strong>Fleet</strong>
          </div>
          <h3>Create your seller workspace</h3>
          <p>
            Add equipment and transport listings with photos, specs, rates,
            documents, and driver details.
          </p>
          <Link to="/become-seller" onClick={onNavigate}>
            Get Started
          </Link>
        </article>
        <article>
          <div className="seller-mega-visual">
            <span>RFQ</span>
            <strong>Offers</strong>
          </div>
          <h3>Win RFQ opportunities</h3>
          <p>
            View buyer RFQs, send quotations, and respond faster from one focused
            seller dashboard.
          </p>
          <Link to="/become-seller" onClick={onNavigate}>
            Start Selling
          </Link>
        </article>
      </div>
    </div>
  );
}

function getFallbackName(user: AuthUser) {
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Account';
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
