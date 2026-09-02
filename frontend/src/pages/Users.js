import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Table, Button, Form, Modal,
  Alert, Spinner, Badge, InputGroup
} from 'react-bootstrap';
import { usersAPI, getCollection } from '../services/api';

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    password_confirmation: '',
    is_admin: false,
  });

  // دریافت لیست کاربران از API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const response = await usersAPI.getAll(params);
      setUsers(getCollection(response));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(t('error_loading_users'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // باز کردن مودال
  const handleShowModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        password: '',
        password_confirmation: '',
        is_admin: user.is_admin || false,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        password: '',
        password_confirmation: '',
        is_admin: false,
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ارسال فرم
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // اعتبارسنجی
    if (!editingUser && formData.password !== formData.password_confirmation) {
      setError(t('passwords_do_not_match'));
      setSubmitting(false);
      return;
    }

    if (!editingUser && formData.password.length < 4) {
      setError(t('password_too_short'));
      setSubmitting(false);
      return;
    }

    try {
      const dataToSubmit = {
        username: formData.username,
        name: formData.name,
        is_admin: formData.is_admin,
      };

      // اگر رمز وارد شده بود، اضافه کن
      if (formData.password) {
        dataToSubmit.password = formData.password;
      }

      if (editingUser) {
        await usersAPI.update(editingUser.id, dataToSubmit);
        setSuccess(t('user_updated_successfully'));
      } else {
        await usersAPI.create(dataToSubmit);
        setSuccess(t('user_created_successfully'));
      }

      setTimeout(() => {
        handleCloseModal();
        fetchUsers();
      }, 1500);

    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.message || t('error_saving_user'));
    } finally {
      setSubmitting(false);
    }
  };

  // حذف کاربر
  const handleDelete = async (userId) => {
    // جلوگیری از حذف کاربر فعلی
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.id === userId) {
      setError(t('cannot_delete_self'));
      return;
    }

    if (!window.confirm(t('confirm_delete'))) return;

    try {
      await usersAPI.delete(userId);
      setSuccess(t('user_deleted_successfully'));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || t('error_deleting_user'));
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
          <h1>{t('users')}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            {t('add')} {t('user')}
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
            <Button variant="outline-secondary" onClick={fetchUsers}>
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
                <th>{t('username')}</th>
                <th>{t('name')}</th>
                <th>{t('role')}</th>
                <th>{t('created_at')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="6" className="text-center">{t('no_data')}</td></tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.name}</td>
                    <td>
                      <Badge bg={user.is_admin ? 'danger' : 'info'}>
                        {user.is_admin ? t('admin') : t('user')}
                      </Badge>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(user)}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
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
            {editingUser ? t('edit') : t('add')} {t('user')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{t('username')} *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder={t('enter_username')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('name')} *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t('enter_full_name')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {editingUser ? t('new_password_optional') : t('password')} *
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!editingUser}
                placeholder={editingUser ? t('leave_blank_to_keep') : t('enter_password')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {editingUser ? t('confirm_new_password') : t('confirm_password')}
              </Form.Label>
              <Form.Control
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required={!editingUser}
                placeholder={t('confirm_password')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="is_admin"
                label={t('is_admin')}
                checked={formData.is_admin}
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                {t('admin_privileges_description')}
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : (editingUser ? t('update') : t('create'))}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;