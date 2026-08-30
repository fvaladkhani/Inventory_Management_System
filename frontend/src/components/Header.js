import React, { useState } from 'react';
import { Navbar, Nav, Dropdown, Modal, Button, Form, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';

const Header = ({ user, setUser }) => {
  const { t, i18n } = useTranslation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  localStorage.setItem('i18nextLng', lng);
};

  // ---- مدیریت تغییر رمز ----
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setError(t('passwords_do_not_match'));
      setSubmitting(false);
      return;
    }

    if (passwordData.new_password.length < 4) {
      setError(t('password_too_short'));
      setSubmitting(false);
      return;
    }

    try {
      await authAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });
      setSuccess(t('password_changed_successfully'));
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          new_password_confirmation: '',
        });
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || t('error_changing_password'));
    } finally {
      setSubmitting(false);
    }
  };

  // ---- مدیریت پروفایل ----
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // در واقعیت باید API به‌روزرسانی پروفایل داشته باشید
      // اینجا شبیه‌سازی می‌کنیم
      const updatedUser = {
        ...user,
        name: profileData.name,
        username: profileData.username,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess(t('profile_updated_successfully'));
      setTimeout(() => {
        setShowProfileModal(false);
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || t('error_updating_profile'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar bg="white" expand="lg" className="border-bottom px-4">
        <Navbar.Brand>{t('app_name')}</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            <Dropdown align="end" className="me-3">
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                {i18n.language === 'fa' ? '🇮🇷 فارسی' : '🇬🇧 English'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => changeLanguage('en')}>🇬🇧 English</Dropdown.Item>
                <Dropdown.Item onClick={() => changeLanguage('fa')}>🇮🇷 فارسی</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-secondary" id="user-dropdown">
                {user?.name}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setShowProfileModal(true)}>
                  {t('profile')}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setShowPasswordModal(true)}>
                  {t('change_password')}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>{t('logout')}</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Modal تغییر رمز */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t('change_password')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>{t('current_password')} *</Form.Label>
              <Form.Control
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
                placeholder={t('enter_current_password')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('new_password')} *</Form.Label>
              <Form.Control
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
                placeholder={t('enter_new_password')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('confirm_new_password')} *</Form.Label>
              <Form.Control
                type="password"
                name="new_password_confirmation"
                value={passwordData.new_password_confirmation}
                onChange={handlePasswordChange}
                required
                placeholder={t('confirm_new_password')}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : t('change')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal پروفایل */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t('profile')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleProfileSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>{t('username')} *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                required
                placeholder={t('enter_username')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t('name')} *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                required
                placeholder={t('enter_full_name')}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? t('saving') : t('update')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default Header;