import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Form, Button, Table, Badge,
  Alert, Spinner, Tab, Tabs, ButtonGroup
} from 'react-bootstrap';
import {
  dashboardAPI,
  productsAPI,
  inventoryAPI,
  inboundOrdersAPI,
  outboundOrdersAPI
} from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, Area
} from 'recharts';
import { exportToPDF, exportToExcel, exportToCSV, formatCurrency, formatDate } from '../utils/exportUtils';

const Reports = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [exporting, setExporting] = useState(false);

  // فیلترهای گزارش
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    report_type: 'inventory',
  });

  // داده‌های گزارشات
  const [inventoryData, setInventoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [warehouseUtilization, setWarehouseUtilization] = useState([]);
  const [salesTrends, setSalesTrends] = useState([]);
  const [summaryData, setSummaryData] = useState({
    total_products: 0,
    total_inventory_value: 0,
    low_stock_items: 0,
    total_sales: 0,
    total_purchases: 0,
    profit: 0,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getReportColumns = () => {
    switch(activeTab) {
      case 'inventory':
        return [
          { key: 'warehouse_name', label: t('warehouse') },
          { key: 'location', label: t('location') },
          { key: 'unique_products', label: t('unique_products') },
          { key: 'total_quantity', label: t('total_quantity') },
          {
            key: 'total_value',
            label: t('total_value'),
            accessor: (row) => formatCurrency(row.total_value)
          },
          {
            key: 'low_stock_items',
            label: t('low_stock_items'),
            accessor: (row) => row.low_stock_items || 0
          },
        ];
      case 'sales':
        return [
          { key: 'month', label: t('month') },
          {
            key: 'order_count',
            label: t('order_count'),
            accessor: (row) => row.order_count || 0
          },
          {
            key: 'total_sales',
            label: t('total_sales'),
            accessor: (row) => formatCurrency(row.total_sales || 0)
          },
          {
            key: 'avg_order_value',
            label: t('avg_order_value'),
            accessor: (row) => formatCurrency(row.avg_order_value || 0)
          },
        ];
      case 'analysis':
        return [
          { key: 'product_name', label: t('product') },
          { key: 'sku', label: 'SKU' },
          {
            key: 'total_quantity',
            label: t('total_quantity'),
            accessor: (row) => row.total_quantity || 0
          },
          {
            key: 'total_revenue',
            label: t('revenue'),
            accessor: (row) => formatCurrency(row.total_revenue || 0)
          },
        ];
      default:
        return [];
    }
  };

  // دریافت داده‌های گزارش
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      // دریافت داده‌های مختلف
      const [
        inventoryRes,
        topProductsRes,
        warehouseUtilRes,
        salesTrendsRes,
        inboundRes,
        outboundRes,
        productsRes
      ] = await Promise.all([
        inventoryAPI.getSummary(),
        dashboardAPI.getTopProducts(10, 'revenue'),
        dashboardAPI.getWarehouseUtilization(),
        dashboardAPI.getSalesTrends(12),
        inboundOrdersAPI.getAll({ per_page: 100 }),
        outboundOrdersAPI.getAll({ per_page: 100 }),
        productsAPI.getAll({ per_page: 100 }),
      ]);

      // تنظیم داده‌ها
      const inventory = inventoryRes.data || [];
      setInventoryData(inventory);
      setTopProductsData(topProductsRes.data || []);
      setWarehouseUtilization(warehouseUtilRes.data || []);
      setSalesTrends(salesTrendsRes.data || []);

      // محاسبه خلاصه
      const inboundOrders = inboundRes.data.data || [];
      const outboundOrders = outboundRes.data.data || [];
      const products = productsRes.data.data || [];

      const totalPurchases = inboundOrders.reduce((sum, o) => sum + (o.order_total || 0), 0);
      const totalSales = outboundOrders.reduce((sum, o) => sum + (o.order_total || 0), 0);

      // محاسبه ارزش کل موجودی و کمبود موجودی
      let totalInventoryValue = 0;
      let lowStockCount = 0;

      inventory.forEach(item => {
        const product = products.find(p => p.product_id === item.product_id);
        if (product) {
          const itemValue = (item.total_quantity || 0) * (product.base_price || 0);
          totalInventoryValue += itemValue;

          if ((item.total_quantity || 0) <= (product.minimum_quantity || 0)) {
            lowStockCount += item.total_quantity || 0;
          }
        }
      });

      setSummaryData({
        total_products: products.length,
        total_inventory_value: totalInventoryValue,
        low_stock_items: lowStockCount,
        total_sales: totalSales,
        total_purchases: totalPurchases,
        profit: totalSales - totalPurchases,
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(t('error_loading_reports'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تابع خروجی گرفتن
  const handleExport = async (format) => {
    setExporting(true);
    try {
      let data = [];
      let columns = [];
      let title = '';
      let filename = '';

      switch(activeTab) {
        case 'inventory':
          data = inventoryData;
          columns = getReportColumns();
          title = t('inventory_report');
          filename = 'inventory_report';
          break;
        case 'sales':
          data = salesTrends;
          columns = getReportColumns();
          title = t('sales_report');
          filename = 'sales_report';
          break;
        case 'analysis':
          data = topProductsData;
          columns = getReportColumns();
          title = t('analysis_report');
          filename = 'analysis_report';
          break;
        default:
          data = [];
          columns = [];
      }

      if (data.length === 0) {
        setError(t('no_data_to_export'));
        setExporting(false);
        return;
      }

      const fullTitle = `${title} - ${new Date().toLocaleDateString()}`;
      const fullFilename = `${filename}_${new Date().toISOString().slice(0, 10)}`;

      switch(format) {
        case 'pdf':
          exportToPDF(data, columns, fullTitle, fullFilename);
          break;
        case 'excel':
          exportToExcel(data, columns, fullFilename);
          break;
        case 'csv':
          exportToCSV(data, columns, fullFilename);
          break;
        default:
          break;
      }

    } catch (error) {
      console.error('Error exporting:', error);
      setError(t('error_exporting'));
    } finally {
      setExporting(false);
    }
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
    <div>
      {/* Header با دکمه‌های خروجی */}
      <Row className="mb-4">
        <Col>
          <h1>{t('reports')}</h1>
        </Col>
        <Col xs="auto">
          <ButtonGroup>
            <Button
              variant="success"
              onClick={() => handleExport('excel')}
              disabled={exporting}
            >
              📊 {t('export_excel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
            >
              📄 {t('export_pdf')}
            </Button>
            <Button
              variant="info"
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              📋 {t('export_csv')}
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {/* Summary Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center h-100 bg-primary text-white">
            <Card.Body>
              <Card.Title>{t('total_products')}</Card.Title>
              <h2>{summaryData.total_products}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-success text-white">
            <Card.Body>
              <Card.Title>{t('total_inventory_value')}</Card.Title>
              <h4>{formatCurrency(summaryData.total_inventory_value)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-warning text-white">
            <Card.Body>
              <Card.Title>{t('total_sales')}</Card.Title>
              <h4>{formatCurrency(summaryData.total_sales)}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-info text-white">
            <Card.Body>
              <Card.Title>{t('profit')}</Card.Title>
              <h4 className={summaryData.profit >= 0 ? '' : 'text-danger'}>
                {formatCurrency(summaryData.profit)}
              </h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        {/* Tab: موجودی */}
        <Tab eventKey="inventory" title={t('inventory_report')}>
          <Card>
            <Card.Body>
              <h5>{t('inventory_by_warehouse')}</h5>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>{t('warehouse')}</th>
                    <th>{t('location')}</th>
                    <th>{t('unique_products')}</th>
                    <th>{t('total_quantity')}</th>
                    <th>{t('total_value')}</th>
                    <th>{t('low_stock_items')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.length === 0 ? (
                    <tr><td colSpan="6" className="text-center">{t('no_data')}</td></tr>
                  ) : (
                    inventoryData.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.warehouse_name}</strong></td>
                        <td>{item.location || '-'}</td>
                        <td>{item.unique_products || 0}</td>
                        <td>{item.total_quantity || 0}</td>
                        <td>{formatCurrency(item.total_value)}</td>
                        <td>
                          <Badge bg={(item.low_stock_items || 0) > 0 ? 'danger' : 'success'}>
                            {item.low_stock_items || 0}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* Tab: فروش */}
        <Tab eventKey="sales" title={t('sales_report')}>
          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Body>
                  <h5>{t('sales_trends')}</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total_sales"
                        stroke="#8884d8"
                        name={t('total_sales')}
                      />
                      <Area
                        type="monotone"
                        dataKey="total_sales"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <h5>{t('top_products')}</h5>
                  <Table striped hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('product')}</th>
                        <th>{t('revenue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductsData.length === 0 ? (
                        <tr><td colSpan="3" className="text-center">{t('no_data')}</td></tr>
                      ) : (
                        topProductsData.slice(0, 5).map((product, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{product.product_name}</td>
                            <td>{formatCurrency(product.total_revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Tab: تحلیل */}
        <Tab eventKey="analysis" title={t('analysis')}>
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Body>
                  <h5>{t('warehouse_utilization')}</h5>
                  <ResponsiveContainer width="100%" height={300}>
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <h5>{t('low_stock_alert')}</h5>
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>{t('product')}</th>
                        <th>{t('current_stock')}</th>
                        <th>{t('min_quantity')}</th>
                        <th>{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.filter(item => (item.low_stock_items || 0) > 0).length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-success">
                          {t('all_warehouses_healthy')}
                        </td></tr>
                      ) : (
                        inventoryData.filter(item => (item.low_stock_items || 0) > 0).map((item, index) => (
                          <tr key={index}>
                            <td>{item.warehouse_name}</td>
                            <td>{item.total_quantity || 0}</td>
                            <td>{item.low_stock_items || 0}</td>
                            <td>
                              <Badge bg="danger">{t('low_stock')}</Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Filters */}
      <Row className="mt-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>{t('from_date')}</Form.Label>
            <Form.Control
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>{t('to_date')}</Form.Label>
            <Form.Control
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>{t('report_type')}</Form.Label>
            <Form.Select
              value={filters.report_type}
              onChange={(e) => setFilters({...filters, report_type: e.target.value})}
            >
              <option value="inventory">{t('inventory')}</option>
              <option value="sales">{t('sales')}</option>
              <option value="purchases">{t('purchases')}</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button variant="primary" onClick={fetchReportData} className="w-100">
            {t('generate_report')}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;