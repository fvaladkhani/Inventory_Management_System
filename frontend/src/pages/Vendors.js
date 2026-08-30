import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal,
  InputGroup, Alert, Spinner, Tabs, Tab
} from 'react-bootstrap';
import { vendorsAPI } from '../services/api';

const Vendors = () => {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // فرم Vendor
  const [formData, setFormData] = useState({
    vendor_name: '',
    contact_info: '',
    address: '',
  });

  // فرم Contact
  const [contactFormData, setContactFormData] = useState({
    contact_name: '',
    contact_position: '',
    contact_email: '',
    contact_phone: '',
  });

  // دریافت لیست تأمین‌کنندگان
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const response = await vendorsAPI.getAll(params);
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError(t('error_loading_vendors'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ---- مدیریت Vendor ----

  const handleShowModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        vendor_name: vendor.vendor_name,
        contact_info: vendor.contact_info || '',
        address: vendor.address || '',
      });
    } else {
      setEditingVendor(null);
      setFormData({
        vendor_name: '',
        contact_info: '',
        address: '',
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendor(null);
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
      if (editingVendor) {
        await vendorsAPI.update(editingVendor.vendor_id, formData);
        setSuccess(t('vendor_updated_successfully'));
      } else {
        await vendorsAPI.create(formData);
        setSuccess(t('vendor_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchVendors();
      }, 1500);
    } catch (error) {
      console.error('Error saving vendor:', error);
      setError(error.response?.data?.message || t('error_saving_vendor'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await vendorsAPI.delete(vendorId);
      setSuccess(t('vendor_deleted_successfully'));
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      setError(error.response?.data?.message || t('error_deleting_vendor'));
    }
  };

  // ---- مدیریت Contact ----

  const handleShowContactModal = (vendor, contact = null) => {
    setSelectedVendor(vendor);
    if (contact) {
      setEditingContact(contact);
      setContactFormData({
        contact_name: contact.contact_name,
        contact_position: contact.contact_position || '',
        contact_email: contact.contact_email || '',
        contact_phone: contact.contact_phone || '',
      });
    } else {
      setEditingContact(null);
      setContactFormData({
        contact_name: '',
        contact_position: '',
        contact_email: '',
        contact_phone: '',
      });
    }
    setShowContactModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setSelectedVendor(null);
    setEditingContact(null);
    setError('');
    setSuccess('');
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // در واقعیت باید API مخصوص Contacts را فراخوانی کنید
      // اینجا شبیه‌سازی می‌کنیم
      const contacts = JSON.parse(localStorage.getItem('vendor_contacts') || '{}');

      if (!contacts[selectedVendor.vendor_id]) {
        contacts[selectedVendor.vendor_id] = [];
      }

      if (editingContact) {
        const index = contacts[selectedVendor.vendor_id].findIndex(
          c => c.contact_id === editingContact.contact_id
        );
        if (index !== -1) {
          contacts[selectedVendor.vendor_id][index] = {
            ...editingContact,
            ...contactFormData,
          };
        }
        setSuccess(t('contact_updated_successfully'));
      } else {
        const newContact = {
          contact_id: Date.now(),
          ...contactFormData,
          vendor_id: selectedVendor.vendor_id,
        };
        contacts[selectedVendor.vendor_id].push(newContact);
        setSuccess(t('contact_created_successfully'));
      }

      localStorage.setItem('vendor_contacts', JSON.stringify(contacts));

      setTimeout(() => {
        handleCloseContactModal();
        fetchVendors();
      }, 1500);
    } catch (error) {
      console.error('Error saving contact:', error);
      setError(error.response?.data?.message || t('error_saving_contact'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (vendorId, contactId) => {
    if (!window.confirm(t('confirm_delete'))) return;

    try {
      const contacts = JSON.parse(localStorage.getItem('vendor_contacts') || '{}');
      if (contacts[vendorId]) {
        contacts[vendorId] = contacts[vendorId].filter(c => c.contact_id !== contactId);
        localStorage.setItem('vendor_contacts', JSON.stringify(contacts));
        setSuccess(t('contact_deleted_successfully'));
        fetchVendors();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError(error.response?.data?.message || t('error_deleting_contact'));
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
          <h1>{t('vendors')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('vendor')}
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
            <Button variant="outline-secondary" onClick={fetchVendors}>
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
                <th>{t('contact_info')}</th>
                <th>{t('address')}</th>
                <th>{t('contacts')}</th>
                <th>{t('orders')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr><td colSpan="7" className="text-center">{t('no_data')}</td></tr>
              ) : (
                vendors.map((vendor, index) => {
                  const vendorContacts = JSON.parse(
                    localStorage.getItem('vendor_contacts') || '{}'
                  )[vendor.vendor_id] || [];

                  return (
                    <tr key={vendor.vendor_id}>
                      <td>{index + 1}</td>
                      <td><strong>{vendor.vendor_name}</strong></td>
                      <td>{vendor.contact_info}</td>
                      <td>{vendor.address}</td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleShowContactModal(vendor)}
                        >
                          {vendorContacts.length} {t('contacts')}
                        </Button>
                      </td>
                      <td>{vendor.inbound_orders_count || 0}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(vendor)}
                        >
                          {t('edit')}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(vendor.vendor_id)}
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

      {/* Vendor Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVendor ? t('edit') : t('add')} {t('vendor')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('vendor_name')} *</Form.Label>
              <Form.Control
                type="text"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('contact_info')}</Form.Label>
              <Form.Control
                type="text"
                name="contact_info"
                value={formData.contact_info}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('address')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingVendor ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Contact Modal */}
      <Modal show={showContactModal} onHide={handleCloseContactModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedVendor?.vendor_name} - {editingContact ? t('edit') : t('add')} {t('contact')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleContactSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('contact_name')} *</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_name"
                    value={contactFormData.contact_name}
                    onChange={handleContactChange}
                    required
                    placeholder={t('enter_contact_name')}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('contact_position')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_position"
                    value={contactFormData.contact_position}
                    onChange={handleContactChange}
                    placeholder={t('enter_contact_position')}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('email')}</Form.Label>
                  <Form.Control
                    type="email"
                    name="contact_email"
                    value={contactFormData.contact_email}
                    onChange={handleContactChange}
                    placeholder={t('enter_email')}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('phone')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_phone"
                    value={contactFormData.contact_phone}
                    onChange={handleContactChange}
                    placeholder={t('enter_phone')}
                  />
                </Form.Group>
              </Col>
            </Row>

            {selectedVendor && (
              <div className="mt-3">
                <h6>{t('existing_contacts')}</h6>
                <Table striped hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>{t('name')}</th>
                      <th>{t('position')}</th>
                      <th>{t('email')}</th>
                      <th>{t('phone')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(JSON.parse(localStorage.getItem('vendor_contacts') || '{}')[selectedVendor.vendor_id] || []).map((contact) => (
                      <tr key={contact.contact_id}>
                        <td>{contact.contact_name}</td>
                        <td>{contact.contact_position}</td>
                        <td>{contact.contact_email}</td>
                        <td>{contact.contact_phone}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowContactModal(selectedVendor, contact)}
                          >
                            {t('edit')}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteContact(selectedVendor.vendor_id, contact.contact_id)}
                          >
                            {t('delete')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!(JSON.parse(localStorage.getItem('vendor_contacts') || '{}')[selectedVendor.vendor_id] || []).length) && (
                      <tr><td colSpan="5" className="text-center">{t('no_contacts')}</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseContactModal}>
              {t('close')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingContact ? t('update') : t('add'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Vendors;