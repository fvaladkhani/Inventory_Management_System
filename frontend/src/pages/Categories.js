import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal,
  InputGroup, Alert, Spinner
} from 'react-bootstrap';
import { productCategoriesAPI, getCollection } from '../services/api';

const Categories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
  });

  // دریافت لیست دسته‌بندی‌ها
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const response = await productCategoriesAPI.getAll(params);
      // API به صورت paginate برمی‌گرداند، پس data.data را بررسی می‌کنیم
      setCategories(getCollection(response));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(t('error_loading_categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // باز کردن مودال
  const handleShowModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        category_name: category.category_name,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        category_name: '',
        description: '',
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
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
      if (editingCategory) {
        await productCategoriesAPI.update(editingCategory.category_id, formData);
        setSuccess(t('category_updated_successfully'));
      } else {
        await productCategoriesAPI.create(formData);
        setSuccess(t('category_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchCategories();
      }, 1500);

    } catch (error) {
      console.error('Error saving category:', error);
      setError(error.response?.data?.message || t('error_saving_category'));
    } finally {
      setSubmitting(false);
    }
  };

  // حذف دسته‌بندی
  const handleDelete = async (categoryId) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await productCategoriesAPI.delete(categoryId);
      setSuccess(t('category_deleted_successfully'));
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error.response?.data?.message || t('error_deleting_category'));
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
          <h1>{t('categories')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('category')}
          </Button>
        </Col>
      </Row>

      {/* Messages */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Search */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={fetchCategories}>
              {t('search')}
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Card.Body>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('name')}</th>
                <th>{t('description')}</th>
                <th>{t('products_count')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan="5" className="text-center">{t('no_data')}</td></tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.category_id}>
                    <td>{index + 1}</td>
                    <td><strong>{category.category_name}</strong></td>
                    <td>{category.description}</td>
                    <td>{category.products?.length || 0}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(category)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(category.category_id)}
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
            {editingCategory ? t('edit') : t('add')} {t('category')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('name')} *</Form.Label>
              <Form.Control
                type="text"
                name="category_name"
                value={formData.category_name}
                onChange={handleChange}
                required
                placeholder={t('enter_category_name')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('description')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('enter_category_description')}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingCategory ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;