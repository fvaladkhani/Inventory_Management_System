import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { path: '/dashboard', label: t('dashboard'), icon: '📊' },
    { path: '/inbound-orders', label: t('inbound_orders'), icon: '📥' },
    { path: '/outbound-orders', label: t('outbound_orders'), icon: '📤' },
    { path: '/products', label: t('products'), icon: '📦' },
    { path: '/variants', label: t('variants'), icon: '🎨' },
    { path: '/categories', label: t('categories'), icon: '🏷️' },
    { path: '/bundles', label: t('bundles'), icon: '📦' },
    { path: '/offers', label: t('offers'), icon: '🏷️' },
    { path: '/inventory', label: t('inventory'), icon: '📋' },
    { path: '/customers', label: t('customers'), icon: '👥' },
    { path: '/vendors', label: t('vendors'), icon: '🏢' },
    { path: '/warehouses', label: t('warehouses'), icon: '🏭' },
    { path: '/order-statuses', label: t('order_statuses'), icon: '📌' },
    { path: '/transaction-types', label: t('transaction_types'), icon: '🔄' },
     { path: '/users', label: t('users'), icon: '👤' },
     { path: '/reports', label: t('reports'), icon: '📊' },
     { path: '/settings', label: t('settings'), icon: '⚙️' },
  ];

  return (
    <div className="sidebar bg-dark">
      <div className="p-3">
        <h5 className="text-white mb-0">{t('app_name')}</h5>
      </div>
      <Nav className="flex-column">
        {menuItems.map((item) => (
          <Nav.Item key={item.path}>
            <Nav.Link
              as={Link}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    </div>
  );
};

export default Sidebar;