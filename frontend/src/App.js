import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Warehouses from './pages/Warehouses';
import InboundOrders from './pages/InboundOrders';
import OutboundOrders from './pages/OutboundOrders';
import Categories from './pages/Categories';
import Variants from './pages/Variants';
import OrderStatuses from './pages/OrderStatuses';
import TransactionTypes from './pages/TransactionTypes';
import Bundles from './pages/Bundles';
import Offers from './pages/Offers';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isLoggedIn = Boolean(user);

  useEffect(() => {
    const handleAuthExpired = () => setUser(null);
    window.addEventListener('auth-expired', handleAuthExpired);

    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  if (!isLoggedIn) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        <Container fluid>
          <Row>
            <Col md={2} className="p-0">
              <Sidebar user={user} />
            </Col>
            <Col md={10} className="main-content">
              <Header user={user} setUser={setUser} />
              <Container fluid className="p-4">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/vendors" element={<Vendors />} />
                  <Route path="/warehouses" element={<Warehouses />} />
                  <Route path="/inbound-orders" element={<InboundOrders />} />
                  <Route path="/outbound-orders" element={<OutboundOrders />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/variants" element={<Variants />} />
                  <Route path="/order-statuses" element={<OrderStatuses />} />
                  <Route path="/transaction-types" element={<TransactionTypes />} />
                  <Route path="/bundles" element={<Bundles />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
    </Router>
  );
}

export default App;