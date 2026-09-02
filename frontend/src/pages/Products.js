import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Card, Table, Button, Form, Modal, Badge, InputGroup, Alert } from 'react-bootstrap';
import { productsAPI, lookupAPI, getCollection } from '../services/api';

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    sku: '',
    barcode: '',
    description: '',
    cost_price: '',
    price_gain: '',
    base_price: '',
    dimension: '',
    weight: '',
    brand: '',
    unit_type: '',
    minimum_quantity: '',
  });

  // دریافت محصولات
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category_id = selectedCategory;

      const response = await productsAPI.getAll(params);
      setProducts(getCollection(response));
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(t('error_loading_products'));
    } finally {
      setLoading(false);
    }
  };

  // دریافت دسته‌بندی‌ها
  const fetchCategories = async () => {
    try {
      const response = await lookupAPI.getProductCategories();
      // ✅ اطمینان از اینکه response.data یک آرایه است
      setCategories(getCollection(response));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  const handleShowModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        product_name: product.product_name,
        category_id: product.category_id,
        sku: product.sku,
        barcode: product.barcode || '',
        description: product.description || '',
        cost_price: product.cost_price,
        price_gain: product.price_gain,
        base_price: product.base_price,
        dimension: product.dimension || '',
        weight: product.weight || '',
        brand: product.brand || '',
        unit_type: product.unit_type || '',
        minimum_quantity: product.minimum_quantity,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        product_name: '',
        category_id: '',
        sku: '',
        barcode: '',
        description: '',
        cost_price: '',
        price_gain: '',
        base_price: '',
        dimension: '',
        weight: '',
        brand: '',
        unit_type: '',
        minimum_quantity: '',
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.product_id, formData);
        setSuccess(t('product_updated_successfully'));
      } else {
        await productsAPI.create(formData);
        setSuccess(t('product_created_successfully'));
      }
      setTimeout(() => {
        handleCloseModal();
        fetchProducts();
      }, 1500);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.message || t('error_saving_product'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await productsAPI.delete(productId);
        setSuccess(t('product_deleted_successfully'));
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setError(error.response?.data?.message || t('error_deleting_product'));
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      <Row className="mb-4">
        <Col>
          <h1>{t('products')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('product')}
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">{t('all_categories')}</option>
            {Array.isArray(categories) && categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>SKU</th>
                <th>{t('category')}</th>
                <th>{t('price')}</th>
                <th>{t('stock')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="7" className="text-center">{t('no_data')}</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product.product_id}>
                    <td>
                      <div>
                        <strong>{product.product_name}</strong>
                        {product.brand && <div className="text-muted small">{product.brand}</div>}
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>{product.category?.category_name}</td>
                    <td>${product.base_price}</td>
                    <td>{product.total_inventory || 0}</td>
                    <td>
                      {(product.total_inventory || 0) <= product.minimum_quantity ? (
                        <Badge bg="danger">{t('low_stock')}</Badge>
                      ) : (
                        <Badge bg="success">{t('in_stock')}</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(product)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(product.product_id)}
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

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? t('edit') : t('add')} {t('product')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('name')} *</Form.Label>
                  <Form.Control
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('category')} *</Form.Label>
                  <Form.Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('select')}</option>
                    {Array.isArray(categories) && categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {/* ... بقیه فرم ... */}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingProduct ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;