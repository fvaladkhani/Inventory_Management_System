import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal,
  Alert, Spinner
} from 'react-bootstrap';
import { productsAPI, productVariantsAPI } from '../services/api';

const Variants = () => {
  const { t } = useTranslation();
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    variant_name: '',
    variant_sku: '',
    additional_price: 0,
  });

  // دریافت محصولات و واریانت‌ها
  const fetchData = async () => {
    try {
      setLoading(true);

      // دریافت محصولات
      const productsRes = await productsAPI.getAll({ per_page: 100 });
      setProducts(productsRes.data.data || []);

      // دریافت واریانت‌ها
      const params = {};
      if (selectedProduct) params.product_id = selectedProduct;

      const variantsRes = await productVariantsAPI.getAll(params);
      // API به صورت paginate برمی‌گرداند
      const variantsData = variantsRes.data.data || variantsRes.data || [];

      // اضافه کردن نام محصول به هر واریانت
      const variantsWithProduct = variantsData.map(v => {
        const product = productsRes.data.data.find(p => p.product_id === v.product_id);
        return {
          ...v,
          product_name: product?.product_name || 'Unknown',
          product_sku: product?.sku || '',
        };
      });

      setVariants(variantsWithProduct);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(t('error_loading_variants'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // باز کردن مودال
  const handleShowModal = (variant = null) => {
    if (variant) {
      setEditingVariant(variant);
      setFormData({
        product_id: variant.product_id,
        variant_name: variant.variant_name,
        variant_sku: variant.variant_sku || '',
        additional_price: variant.additional_price || 0,
      });
    } else {
      setEditingVariant(null);
      setFormData({
        product_id: selectedProduct || '',
        variant_name: '',
        variant_sku: '',
        additional_price: 0,
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVariant(null);
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

    try {
      const dataToSubmit = {
        product_id: parseInt(formData.product_id),
        variant_name: formData.variant_name,
        variant_sku: formData.variant_sku || `VAR-${Date.now().toString().slice(-6)}`,
        additional_price: parseFloat(formData.additional_price) || 0,
      };

      if (editingVariant) {
        await productVariantsAPI.update(editingVariant.variant_id, dataToSubmit);
        setSuccess(t('variant_updated_successfully'));
      } else {
        await productVariantsAPI.create(dataToSubmit);
        setSuccess(t('variant_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchData();
      }, 1500);

    } catch (error) {
      console.error('Error saving variant:', error);
      setError(error.response?.data?.message || t('error_saving_variant'));
    } finally {
      setSubmitting(false);
    }
  };

  // حذف واریانت
  const handleDelete = async (variantId) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await productVariantsAPI.delete(variantId);
      setSuccess(t('variant_deleted_successfully'));
      fetchData();
    } catch (error) {
      console.error('Error deleting variant:', error);
      setError(error.response?.data?.message || t('error_deleting_variant'));
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
          <h1>{t('variants')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('variant')}
          </Button>
        </Col>
      </Row>

      {/* Messages */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Filter by Product */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">{t('all_products')}</option>
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name} ({p.sku})
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Card.Body>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('product')}</th>
                <th>{t('variant_name')}</th>
                <th>{t('variant_sku')}</th>
                <th>{t('additional_price')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 ? (
                <tr><td colSpan="6" className="text-center">{t('no_data')}</td></tr>
              ) : (
                variants.map((variant, index) => (
                  <tr key={variant.variant_id}>
                    <td>{index + 1}</td>
                    <td>{variant.product_name}</td>
                    <td><strong>{variant.variant_name}</strong></td>
                    <td>{variant.variant_sku}</td>
                    <td>${variant.additional_price?.toFixed(2)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(variant)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(variant.variant_id)}
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
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVariant ? t('edit') : t('add')} {t('variant')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('product')} *</Form.Label>
              <Form.Select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                required
              >
                <option value="">{t('select')}</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} ({p.sku})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('variant_name')} *</Form.Label>
              <Form.Control
                type="text"
                name="variant_name"
                value={formData.variant_name}
                onChange={handleChange}
                required
                placeholder={t('enter_variant_name')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('variant_sku')}</Form.Label>
              <Form.Control
                type="text"
                name="variant_sku"
                value={formData.variant_sku}
                onChange={handleChange}
                placeholder={t('enter_variant_sku')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('additional_price')}</Form.Label>
              <Form.Control
                type="number"
                name="additional_price"
                value={formData.additional_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingVariant ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Variants;