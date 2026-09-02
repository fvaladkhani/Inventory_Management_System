import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal, Badge,
  Alert, Spinner
} from 'react-bootstrap';
import { productBundlesAPI, productsAPI, getCollection, formatDecimal } from '../services/api';

const Bundles = () => {
  const { t } = useTranslation();
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // فرم بسته
  const [formData, setFormData] = useState({
    bundle_name: '',
    sku: '',
    barcode: '',
    description: '',
    bundle_price: 0,
    items: [],
  });

  // آیتم جدید برای بسته
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
  });

  // دریافت داده‌ها
  const fetchData = async () => {
    try {
      setLoading(true);

      // دریافت محصولات
      const productsRes = await productsAPI.getAll({ per_page: 100 });
      setProducts(getCollection(productsRes));

      // دریافت بسته‌ها از API
      const bundlesRes = await productBundlesAPI.getAll();
      setBundles(getCollection(bundlesRes));
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(t('error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // محاسبه قیمت بسته
  useEffect(() => {
    calculateBundlePrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items]);

  const calculateBundlePrice = () => {
    if (formData.items.length === 0) {
      setFormData(prev => ({ ...prev, bundle_price: 0 }));
      return;
    }

    let totalPrice = 0;
    formData.items.forEach(item => {
      const product = products.find(p => p.product_id === parseInt(item.product_id));
      if (product) {
        totalPrice += (Number(product.base_price) || 0) * (Number(item.quantity) || 0);
      }
    });

    setFormData(prev => ({
      ...prev,
      bundle_price: totalPrice * 0.9, // 10% تخفیف برای بسته
    }));
  };

  // اضافه کردن محصول به بسته
  const addItemToBundle = () => {
    if (!newItem.product_id || newItem.quantity < 1) {
      setError(t('please_select_product_and_quantity'));
      return;
    }

    const product = products.find(p => p.product_id === parseInt(newItem.product_id));
    if (!product) {
      setError(t('product_not_found'));
      return;
    }

    // بررسی تکراری نبودن
    if (formData.items.some(item => item.product_id === newItem.product_id)) {
      setError(t('product_already_in_bundle'));
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: newItem.product_id,
        product_name: product.product_name,
        sku: product.sku,
        base_price: product.base_price,
        quantity: parseInt(newItem.quantity),
        total_price: (Number(product.base_price) || 0) * (parseInt(newItem.quantity, 10) || 0),
      }]
    }));

    setNewItem({ product_id: '', quantity: 1 });
    setError('');
  };

  // حذف محصول از بسته
  const removeItemFromBundle = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // باز کردن مودال
  const handleShowModal = (bundle = null) => {
    if (bundle) {
      setEditingBundle(bundle);
      setFormData({
        bundle_name: bundle.bundle_name,
        sku: bundle.sku || '',
        barcode: bundle.barcode || '',
        description: bundle.description || '',
        bundle_price: bundle.bundle_price || 0,
        items: bundle.items || [],
      });
    } else {
      setEditingBundle(null);
      setFormData({
        bundle_name: '',
        sku: `BUNDLE-${Date.now().toString().slice(-6)}`,
        barcode: '',
        description: '',
        bundle_price: 0,
        items: [],
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBundle(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // ارسال فرم
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (formData.items.length === 0) {
      setError(t('please_add_at_least_one_item'));
      setSubmitting(false);
      return;
    }

    try {
      const dataToSubmit = {
        bundle_name: formData.bundle_name,
        sku: formData.sku,
        barcode: formData.barcode,
        description: formData.description,
        bundle_price: parseFloat(formData.bundle_price),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
        })),
      };

      if (editingBundle) {
        await productBundlesAPI.update(editingBundle.bundle_id, dataToSubmit);
        setSuccess(t('bundle_updated_successfully'));
      } else {
        await productBundlesAPI.create(dataToSubmit);
        setSuccess(t('bundle_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchData();
      }, 1500);

    } catch (error) {
      console.error('Error saving bundle:', error);
      setError(error.response?.data?.message || t('error_saving_bundle'));
    } finally {
      setSubmitting(false);
    }
  };

  // حذف بسته
  const handleDelete = async (bundleId) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await productBundlesAPI.delete(bundleId);
      setSuccess(t('bundle_deleted_successfully'));
      fetchData();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      setError(error.response?.data?.message || t('error_deleting_bundle'));
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
          <h1>{t('bundles')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('bundle')}
          </Button>
        </Col>
      </Row>

      {/* Messages */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Table */}
      <Card>
        <Card.Body>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('bundle_name')}</th>
                <th>SKU</th>
                <th>{t('items_count')}</th>
                <th>{t('bundle_price')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {bundles.length === 0 ? (
                <tr><td colSpan="7" className="text-center">{t('no_data')}</td></tr>
              ) : (
                bundles.map((bundle, index) => (
                  <tr key={bundle.bundle_id}>
                    <td>{index + 1}</td>
                    <td><strong>{bundle.bundle_name}</strong></td>
                    <td>{bundle.sku}</td>
                    <td>{bundle.items?.length || 0}</td>
                    <td>${formatDecimal(bundle.bundle_price)}</td>
                    <td>
                      <Badge bg={bundle.items?.length > 0 ? 'success' : 'warning'}>
                        {bundle.items?.length > 0 ? t('active') : t('empty')}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(bundle)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(bundle.bundle_id)}
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

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBundle ? t('edit') : t('add')} {t('bundle')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('bundle_name')} *</Form.Label>
                  <Form.Control
                    type="text"
                    name="bundle_name"
                    value={formData.bundle_name}
                    onChange={handleChange}
                    required
                    placeholder={t('enter_bundle_name')}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>SKU</Form.Label>
                  <Form.Control
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder={t('enter_sku')}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('barcode')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder={t('enter_barcode')}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('bundle_price')}</Form.Label>
                  <Form.Control
                    type="number"
                    name="bundle_price"
                    value={formData.bundle_price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>{t('description')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('enter_description')}
              />
            </Form.Group>

            <hr />
            <h5>{t('bundle_items')}</h5>

            {/* افزودن آیتم جدید */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Select
                  value={newItem.product_id}
                  onChange={(e) => setNewItem({...newItem, product_id: e.target.value})}
                >
                  <option value="">{t('select_product')}</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} (${p.base_price})
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                  min="1"
                  placeholder={t('quantity')}
                />
              </Col>
              <Col md={4}>
                <Form.Control
                  type="text"
                  value={
                    newItem.product_id && newItem.quantity
                      ? `$${(products.find(p => p.product_id === parseInt(newItem.product_id))?.base_price || 0) * newItem.quantity}`
                      : ''
                  }
                  disabled
                  placeholder={t('total_price')}
                />
              </Col>
              <Col md={2}>
                <Button variant="primary" onClick={addItemToBundle} className="w-100">
                  {t('add')}
                </Button>
              </Col>
            </Row>

            {/* لیست آیتم‌ها */}
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
                      <td>${formatDecimal(item.base_price)}</td>
                      <td>${formatDecimal(item.total_price)}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeItemFromBundle(index)}
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
                  <td><strong>{t('bundle_price')}</strong></td>
                  <td><strong>${formatDecimal(formData.bundle_price)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingBundle ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Bundles;