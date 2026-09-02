import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal, Badge,
  Alert, Spinner
} from 'react-bootstrap';
import { productOffersAPI, productsAPI, getCollection } from '../services/api';

const Offers = () => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    discount_percentage: 0,
    start_date: '',
    end_date: '',
  });

  // دریافت داده‌ها
  const fetchData = async () => {
    try {
      setLoading(true);

      // دریافت محصولات
      const productsRes = await productsAPI.getAll({ per_page: 100 });
      setProducts(getCollection(productsRes));

      // دریافت تخفیف‌ها از API
      const offersRes = await productOffersAPI.getAll();
      setOffers(getCollection(offersRes));
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

  // باز کردن مودال
  const handleShowModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        product_id: offer.product_id,
        discount_percentage: offer.discount_percentage,
        start_date: offer.start_date?.split('T')[0] || '',
        end_date: offer.end_date?.split('T')[0] || '',
      });
    } else {
      setEditingOffer(null);
      setFormData({
        product_id: '',
        discount_percentage: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffer(null);
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
      const product = products.find(p => p.product_id === parseInt(formData.product_id));
      if (!product) {
        setError(t('product_not_found'));
        setSubmitting(false);
        return;
      }

      const dataToSubmit = {
        product_id: parseInt(formData.product_id),
        discount_percentage: parseFloat(formData.discount_percentage),
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      if (editingOffer) {
        await productOffersAPI.update(editingOffer.offer_id, dataToSubmit);
        setSuccess(t('offer_updated_successfully'));
      } else {
        await productOffersAPI.create(dataToSubmit);
        setSuccess(t('offer_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchData();
      }, 1500);

    } catch (error) {
      console.error('Error saving offer:', error);
      setError(error.response?.data?.message || t('error_saving_offer'));
    } finally {
      setSubmitting(false);
    }
  };

  // حذف تخفیف
  const handleDelete = async (offerId) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await productOffersAPI.delete(offerId);
      setSuccess(t('offer_deleted_successfully'));
      fetchData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      setError(error.response?.data?.message || t('error_deleting_offer'));
    }
  };

  // بررسی فعال بودن تخفیف
  const isOfferActive = (offer) => {
    const now = new Date();
    const start = new Date(offer.start_date);
    const end = new Date(offer.end_date);
    return start <= now && now <= end;
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
          <h1>{t('offers')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('offer')}
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
                <th>{t('product')}</th>
                <th>SKU</th>
                <th>{t('discount')}</th>
                <th>{t('start_date')}</th>
                <th>{t('end_date')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr><td colSpan="8" className="text-center">{t('no_data')}</td></tr>
              ) : (
                offers.map((offer, index) => {
                  const active = isOfferActive(offer);
                  return (
                    <tr key={offer.offer_id}>
                      <td>{index + 1}</td>
                      <td><strong>{offer.product?.product_name}</strong></td>
                      <td>{offer.product?.sku}</td>
                      <td>
                        <Badge bg="info">
                          {offer.discount_percentage}%
                        </Badge>
                      </td>
                      <td>{new Date(offer.start_date).toLocaleDateString()}</td>
                      <td>{new Date(offer.end_date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={active ? 'success' : 'secondary'}>
                          {active ? t('active') : t('inactive')}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(offer)}
                        >
                          {t('edit')}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(offer.offer_id)}
                        >
                          {t('delete')}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingOffer ? t('edit') : t('add')} {t('offer')}
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
                <option value="">{t('select_product')}</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} (${p.base_price})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('discount_percentage')} *</Form.Label>
              <Form.Control
                type="number"
                name="discount_percentage"
                value={formData.discount_percentage}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
              />
              <Form.Text className="text-muted">
                {t('enter_discount_percentage')}
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('start_date')} *</Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('end_date')} *</Form.Label>
                  <Form.Control
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
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
              {submitting ? t('saving') : (editingOffer ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Offers;