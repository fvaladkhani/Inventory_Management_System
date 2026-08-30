import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal,
  Alert, Spinner
} from 'react-bootstrap';

const LookupManager = ({ title, api, fields, primaryKey, listFields }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialFormData = {};
  fields.forEach(field => {
    initialFormData[field.name] = '';
  });

  const [formData, setFormData] = useState(initialFormData);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.getAll();
      setItems(response.data || []);
    } catch (error) {
      console.error(`Error fetching ${title}:`, error);
      setError(t('error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShowModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      const data = {};
      fields.forEach(field => {
        data[field.name] = item[field.name] || '';
      });
      setFormData(data);
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingItem) {
        await api.update(editingItem[primaryKey], formData);
        setSuccess(t('item_updated_successfully'));
      } else {
        await api.create(formData);
        setSuccess(t('item_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchItems();
      }, 1500);

    } catch (error) {
      console.error('Error saving item:', error);
      setError(error.response?.data?.message || t('error_saving_item'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await api.delete(id);
      setSuccess(t('item_deleted_successfully'));
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.response?.data?.message || t('error_deleting_item'));
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
      <Row className="mb-4">
        <Col>
          <h1>{title}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')}
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card>
        <Card.Body>
          <Table striped hover responsive>
            <thead>
              <tr>
                {listFields.map(field => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={listFields.length + 1} className="text-center">{t('no_data')}</td></tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item[primaryKey]}>
                    {listFields.map(field => (
                      <td key={field.key}>
                        {field.key === listFields[0].key ? index + 1 : item[field.key]}
                      </td>
                    ))}
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(item)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(item[primaryKey])}
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

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? t('edit') : t('add')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {fields.map(field => (
              <Form.Group key={field.name} className="mb-3">
                <Form.Label>
                  {field.label}
                  {field.required && ' *'}
                </Form.Label>
                {field.type === 'textarea' ? (
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Form.Control
                    type={field.type || 'text'}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                )}
              </Form.Group>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingItem ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default LookupManager;