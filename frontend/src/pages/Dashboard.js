import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { dashboardAPI } from '../services/api';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_products: 0,
    total_inventory_value: 0,
    low_stock_items: 0,
    total_customers: 0,
    total_vendors: 0,
    pending_inbound_orders: 0,
    pending_outbound_orders: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [warehouseUtilization, setWarehouseUtilization] = useState([]);
  const [salesTrends, setSalesTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          statsRes,
          activityRes,
          topProductsRes,
          warehouseRes,
          trendsRes
        ] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity(),
          dashboardAPI.getTopProducts(5),
          dashboardAPI.getWarehouseUtilization(),
          dashboardAPI.getSalesTrends(6),
        ]);

        setStats(statsRes.data || {});
        setRecentActivity(activityRes.data || []);
        setTopProducts(topProductsRes.data || []);
        setWarehouseUtilization(warehouseRes.data || []);
        setSalesTrends(trendsRes.data || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('loading')}</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h1>{t('dashboard')}</h1>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>{t('total_products')}</Card.Title>
              <h2 className="text-primary">{stats.total_products}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>{t('low_stock_items')}</Card.Title>
              <h2 className="text-warning">{stats.low_stock_items}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>{t('pending_orders')}</Card.Title>
              <h2 className="text-success">
                {(stats.pending_inbound_orders || 0) + (stats.pending_outbound_orders || 0)}
              </h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title>{t('total_inventory_value')}</Card.Title>
              <h4 className="text-info">{formatCurrency(stats.total_inventory_value)}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <Card>
            <Card.Header>
              <strong>{t('sales_trends')}</strong>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total_sales" fill="#8884d8" name={t('total_sales')} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <strong>{t('warehouse_utilization')}</strong>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={warehouseUtilization}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.warehouse_name}: ${entry.total_items}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_items"
                  >
                    {warehouseUtilization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Activity and Top Products */}
      <Row className="g-3">
        <Col md={6}>
          <Card>
            <Card.Header>
              <strong>{t('recent_activity')}</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {recentActivity.length === 0 ? (
                <ListGroup.Item>{t('no_recent_activity')}</ListGroup.Item>
              ) : (
                recentActivity.slice(0, 10).map((item, index) => (
                  <ListGroup.Item key={`${item.type}-${item.order_id || index}`}>
                    {item.type === 'inbound' ? '📥' : '📤'} {t(item.type)} {t('order')} #{item.order_id} -
                    {item.partner_name} ({item.warehouse_name})
                    <Badge bg="info" className="ms-2">{item.status_name}</Badge>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <strong>{t('top_products')}</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {topProducts.length === 0 ? (
                <ListGroup.Item>{t('no_product_activity')}</ListGroup.Item>
              ) : (
                topProducts.map((product, index) => (
                  <ListGroup.Item key={product.sku || index}>
                    <div className="d-flex justify-content-between">
                      <span>
                        <Badge bg="secondary" className="me-2">{index + 1}</Badge>
                        {product.product_name}
                      </span>
                      <span className="text-primary">
                        {product.total_quantity || 0} {t('units')}
                      </span>
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;