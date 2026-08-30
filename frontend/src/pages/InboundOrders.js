import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal, Badge,
  Alert, Spinner, Tabs, Tab  // <-- Tabs و Tab را اضافه کنید
} from 'react-bootstrap';
import {
  inboundOrdersAPI,
  vendorsAPI,
  warehousesAPI,
  orderStatusesAPI,
  productsAPI
} from '../services/api';

const InboundOrders = () => {
  const { t } = useTranslation();

  // State ها
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [trackingData, setTrackingData] = useState([]);

  // فیلترها
  const [filters, setFilters] = useState({
    warehouse_id: '',
    vendor_id: '',
    status_id: '',
    date_from: '',
    date_to: '',
  });

  // داده‌های فرم
  const [formData, setFormData] = useState({
    warehouse_id: '',
    vendor_id: '',
    status_id: '',
    delivery_agent: '',
    order_date: new Date().toISOString().split('T')[0],
    item_total: 0,
    freight_cost: 0,
    discount: 0,
    order_total: 0,
    items: [],
  });

  // داده‌های dropdown
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [products, setProducts] = useState([]);

  // آیتم جدید برای اضافه کردن به سفارش
  const [newItem, setNewItem] = useState({
    product_id: '',
    variant_id: null,
    quantity: 1,
    unit_price: 0,
    total_price: 0,
  });

  // دریافت لیست سفارشات
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      const response = await inboundOrdersAPI.getAll(params);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(t('error_loading_orders'));
    } finally {
      setLoading(false);
    }
  };

  // دریافت داده‌های dropdown
  const fetchDropdownData = async () => {
    try {
      const [vendorsRes, warehousesRes, statusesRes, productsRes] = await Promise.all([
        vendorsAPI.getAll({ per_page: 100 }),
        warehousesAPI.getAll({ per_page: 100 }),
        orderStatusesAPI.getAll(),
        productsAPI.getAll({ per_page: 100 }),
      ]);
      setVendors(vendorsRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
      setStatuses(statusesRes.data || []);
      setProducts(productsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDropdownData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // محاسبه خودکار جمع کل
  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items, formData.freight_cost, formData.discount]);

  // دریافت داده‌های رهگیری
  useEffect(() => {
    if (activeTab === 'tracking' && orders.length > 0) {
      const mockTracking = orders.map(order => ({
        order_id: order.inbound_order_id,
        status_id: order.status_id,
        status_name: order.status?.status_name || 'Unknown',
        tracking_date: order.updated_at || order.created_at || new Date().toISOString(),
        handled_by: order.user?.name || 'System',
        remarks: order.status_id === 7 ? 'Order completed' : 'Order in progress',
      }));
      setTrackingData(mockTracking);
    }
  }, [activeTab, orders]);

  const calculateTotals = () => {
    const itemTotal = formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const freight = parseFloat(formData.freight_cost) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const orderTotal = itemTotal + freight - discount;

    setFormData(prev => ({
      ...prev,
      item_total: itemTotal,
      order_total: orderTotal,
    }));
  };

  // اضافه کردن آیتم به سفارش
  const addItem = () => {
    if (!newItem.product_id || newItem.quantity < 1) {
      setError(t('please_select_product_and_quantity'));
      return;
    }

    const product = products.find(p => p.product_id === parseInt(newItem.product_id));
    const totalPrice = newItem.quantity * newItem.unit_price;

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        ...newItem,
        product_name: product?.product_name || '',
        sku: product?.sku || '',
        total_price: totalPrice,
      }]
    }));

    // Reset newItem
    setNewItem({
      product_id: '',
      variant_id: null,
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    });
    setError('');
  };

  // حذف آیتم از سفارش
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // باز کردن مودال
  const handleShowModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        warehouse_id: order.warehouse_id || '',
        vendor_id: order.vendor_id || '',
        status_id: order.status_id || '',
        delivery_agent: order.delivery_agent || '',
        order_date: order.order_date || new Date().toISOString().split('T')[0],
        item_total: order.item_total || 0,
        freight_cost: order.freight_cost || 0,
        discount: order.discount || 0,
        order_total: order.order_total || 0,
        items: order.items || [],
      });
    } else {
      setEditingOrder(null);
      setFormData({
        warehouse_id: '',
        vendor_id: '',
        status_id: '',
        delivery_agent: '',
        order_date: new Date().toISOString().split('T')[0],
        item_total: 0,
        freight_cost: 0,
        discount: 0,
        order_total: 0,
        items: [],
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setError('');
    setSuccess('');
  };

  // تغییرات در فرم
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // تغییرات در آیتم جدید
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    const product = products.find(p => p.product_id === parseInt(value));

    if (name === 'product_id' && product) {
      setNewItem(prev => ({
        ...prev,
        product_id: value,
        unit_price: product.base_price || 0,
        total_price: (prev.quantity || 1) * (product.base_price || 0),
      }));
    } else if (name === 'quantity') {
      const qty = parseInt(value) || 0;
      setNewItem(prev => ({
        ...prev,
        quantity: qty,
        total_price: qty * prev.unit_price,
      }));
    } else if (name === 'unit_price') {
      const price = parseFloat(value) || 0;
      setNewItem(prev => ({
        ...prev,
        unit_price: price,
        total_price: prev.quantity * price,
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ارسال فرم
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // اعتبارسنجی
    if (formData.items.length === 0) {
      setError(t('please_add_at_least_one_item'));
      setSubmitting(false);
      return;
    }

    try {
      const dataToSubmit = {
        warehouse_id: parseInt(formData.warehouse_id),
        vendor_id: parseInt(formData.vendor_id),
        status_id: parseInt(formData.status_id),
        delivery_agent: formData.delivery_agent,
        order_date: formData.order_date,
        item_total: parseFloat(formData.item_total),
        freight_cost: parseFloat(formData.freight_cost) || 0,
        discount: parseFloat(formData.discount) || 0,
        order_total: parseFloat(formData.order_total),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          variant_id: item.variant_id ? parseInt(item.variant_id) : null,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.total_price),
        })),
      };

      if (editingOrder) {
        await inboundOrdersAPI.update(editingOrder.inbound_order_id, dataToSubmit);
        setSuccess(t('order_updated_successfully'));
      } else {
        await inboundOrdersAPI.create(dataToSubmit);
        setSuccess(t('order_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchOrders();
      }, 1500);

    } catch (error) {
      console.error('Error saving order:', error);
      setError(error.response?.data?.message || t('error_saving_order'));
    } finally {
      setSubmitting(false);
    }
  };

  // دریافت سفارش
  const handleReceive = async (id) => {
    if (!window.confirm(t('confirm_receive_order'))) return;

    try {
      await inboundOrdersAPI.receive(id);
      setSuccess(t('order_received_successfully'));
      fetchOrders();
    } catch (error) {
      console.error('Error receiving order:', error);
      setError(error.response?.data?.message || t('error_receiving_order'));
    }
  };

  // حذف سفارش
  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await inboundOrdersAPI.delete(id);
      setSuccess(t('order_deleted_successfully'));
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(error.response?.data?.message || t('error_deleting_order'));
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
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1>{t('inbound_orders')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('inbound_order')}
          </Button>
        </Col>
      </Row>

      {/* Messages */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Filters */}
      <Row className="mb-4">
        <Col md={2}>
          <Form.Select
            value={filters.warehouse_id}
            onChange={(e) => setFilters({...filters, warehouse_id: e.target.value})}
          >
            <option value="">{t('all')} {t('warehouses')}</option>
            {warehouses.map(w => (
              <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={filters.vendor_id}
            onChange={(e) => setFilters({...filters, vendor_id: e.target.value})}
          >
            <option value="">{t('all')} {t('vendors')}</option>
            {vendors.map(v => (
              <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={filters.status_id}
            onChange={(e) => setFilters({...filters, status_id: e.target.value})}
          >
            <option value="">{t('all')} {t('status')}</option>
            {statuses.map(s => (
              <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Control
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            placeholder={t('from_date')}
          />
        </Col>
        <Col md={2}>
          <Form.Control
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            placeholder={t('to_date')}
          />
        </Col>
        <Col md={2}>
          <Button variant="outline-secondary" onClick={fetchOrders} className="w-100">
            {t('search')}
          </Button>
        </Col>
      </Row>

      {/* Tabs برای نمایش سفارشات و رهگیری */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="orders" title={t('orders')}>
          <Card>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('order_date')}</th>
                    <th>{t('vendor')}</th>
                    <th>{t('warehouse')}</th>
                    <th>{t('item_total')}</th>
                    <th>{t('order_total')}</th>
                    <th>{t('status')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="8" className="text-center">{t('no_data')}</td></tr>
                  ) : (
                    orders.map((order, index) => (
                      <tr key={order.inbound_order_id}>
                        <td>{index + 1}</td>
                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                        <td>{order.vendor?.vendor_name}</td>
                        <td>{order.warehouse?.warehouse_name}</td>
                        <td>${order.item_total?.toFixed(2)}</td>
                        <td><strong>${order.order_total?.toFixed(2)}</strong></td>
                        <td>
                          <Badge bg={order.status_id === 7 ? 'success' : 'warning'}>
                            {order.status?.status_name}
                          </Badge>
                        </td>
                        <td>
                          {order.status_id !== 7 && (
                            <Button
                              variant="success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleReceive(order.inbound_order_id)}
                            >
                              {t('receive')}
                            </Button>
                          )}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(order)}
                            disabled={order.status_id === 7}
                          >
                            {t('edit')}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(order.inbound_order_id)}
                            disabled={order.status_id === 7}
                          >
                            {t('delete')}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="tracking" title={t('tracking')}>
          <Card>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>{t('order')}</th>
                    <th>{t('status')}</th>
                    <th>{t('tracking_date')}</th>
                    <th>{t('handled_by')}</th>
                    <th>{t('remarks')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingData.length === 0 ? (
                    <tr><td colSpan="5" className="text-center">{t('no_tracking_data')}</td></tr>
                  ) : (
                    trackingData.map((track, index) => (
                      <tr key={index}>
                        <td>#{track.order_id}</td>
                        <td>
                          <Badge bg={track.status_id === 7 ? 'success' : 'warning'}>
                            {track.status_name}
                          </Badge>
                        </td>
                        <td>{new Date(track.tracking_date).toLocaleString()}</td>
                        <td>{track.handled_by}</td>
                        <td>{track.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal برای ایجاد/ویرایش */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingOrder ? t('edit') : t('add')} {t('inbound_order')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* اطلاعات اصلی سفارش */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('warehouse')} *</Form.Label>
                  <Form.Select
                    name="warehouse_id"
                    value={formData.warehouse_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('select')}</option>
                    {warehouses.map(w => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('vendor')} *</Form.Label>
                  <Form.Select
                    name="vendor_id"
                    value={formData.vendor_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('select')}</option>
                    {vendors.map(v => (
                      <option key={v.vendor_id} value={v.vendor_id}>
                        {v.vendor_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('status')} *</Form.Label>
                  <Form.Select
                    name="status_id"
                    value={formData.status_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('select')}</option>
                    {statuses.map(s => (
                      <option key={s.status_id} value={s.status_id}>
                        {s.status_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('order_date')}</Form.Label>
                  <Form.Control
                    type="date"
                    name="order_date"
                    value={formData.order_date}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('delivery_agent')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="delivery_agent"
                    value={formData.delivery_agent}
                    onChange={handleChange}
                    placeholder={t('delivery_agent')}
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <h5>{t('order_items')}</h5>

            {/* افزودن آیتم جدید */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Select
                  name="product_id"
                  value={newItem.product_id}
                  onChange={handleNewItemChange}
                >
                  <option value="">{t('select_product')}</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} ({p.sku})
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={newItem.quantity}
                  onChange={handleNewItemChange}
                  min="1"
                  placeholder={t('quantity')}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  name="unit_price"
                  value={newItem.unit_price}
                  onChange={handleNewItemChange}
                  step="0.01"
                  placeholder={t('unit_price')}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="text"
                  value={`$${newItem.total_price.toFixed(2)}`}
                  disabled
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" onClick={addItem} className="w-100">
                  {t('add')}
                </Button>
              </Col>
            </Row>

            {/* لیست آیتم‌های سفارش */}
            <Table striped hover responsive size="sm">
              <thead>
                <tr>
                  <th>{t('product')}</th>
                  <th>SKU</th>
                  <th>{t('quantity')}</th>
                  <th>{t('unit_price')}</th>
                  <th>{t('total_price')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length === 0 ? (
                  <tr><td colSpan="6" className="text-center">{t('no_items_added')}</td></tr>
                ) : (
                  formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td>{item.sku}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unit_price?.toFixed(2)}</td>
                      <td>${item.total_price?.toFixed(2)}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          {t('remove')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3"></td>
                  <td><strong>{t('item_total')}</strong></td>
                  <td><strong>${formData.item_total.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </Table>

            {/* هزینه‌ها و تخفیف */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('freight_cost')}</Form.Label>
                  <Form.Control
                    type="number"
                    name="freight_cost"
                    value={formData.freight_cost}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('discount')}</Form.Label>
                  <Form.Control
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>{t('order_total')}</strong></Form.Label>
                  <Form.Control
                    type="text"
                    value={`$${formData.order_total.toFixed(2)}`}
                    disabled
                    className="fw-bold"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingOrder ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default InboundOrders;