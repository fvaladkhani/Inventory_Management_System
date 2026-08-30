import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Row, Col, Card, Form, Button, Alert, Spinner,
  Tabs, Tab
} from 'react-bootstrap';
import { settingsAPI } from '../services/api';

const Settings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // تنظیمات عمومی
  const [generalSettings, setGeneralSettings] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    currency: 'USD',
    currency_symbol: '$',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    time_format: 'HH:mm',
  });

  // تنظیمات واحدها
  const [unitSettings, setUnitSettings] = useState({
    weight_unit: 'kg',
    dimension_unit: 'cm',
    volume_unit: 'L',
  });

  // تنظیمات انبار
  const [warehouseSettings, setWarehouseSettings] = useState({
    default_warehouse: '',
    low_stock_threshold: 5,
    enable_auto_reorder: false,
    reorder_quantity: 10,
  });

  // تنظیمات ایمیل
  const [emailSettings, setEmailSettings] = useState({
    mail_driver: 'smtp',
    mail_host: '',
    mail_port: 587,
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: '',
    mail_from_name: '',
  });

  // =============================================
  // بارگذاری تنظیمات از API (روش اصلی)
  // =============================================
  const fetchSettingsFromAPI = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await settingsAPI.getAll();
      const settings = response.data || [];

      if (settings.length > 0) {
        // تبدیل تنظیمات به فرمت مناسب
        settings.forEach(setting => {
          const value = setting.value;

          switch(setting.group) {
            case 'general':
              setGeneralSettings(prev => ({ ...prev, [setting.key]: value }));
              break;
            case 'units':
              setUnitSettings(prev => ({ ...prev, [setting.key]: value }));
              break;
            case 'warehouse':
              // تبدیل boolean اگر مقدار string بود
              if (setting.key === 'enable_auto_reorder') {
                setWarehouseSettings(prev => ({
                  ...prev,
                  [setting.key]: value === 'true' || value === true
                }));
              } else {
                setWarehouseSettings(prev => ({ ...prev, [setting.key]: value }));
              }
              break;
            case 'email':
              setEmailSettings(prev => ({ ...prev, [setting.key]: value }));
              break;
            default:
              break;
          }
        });
      } else {
        // اگر تنظیماتی در دیتابیس نبود، از localStorage به‌عنوان fallback استفاده کن
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error fetching settings from API:', error);
      // اگر API خطا داد، از localStorage استفاده کن
      loadFromLocalStorage();
      setError(t('error_loading_settings'));
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // بارگذاری از localStorage (fallback)
  // =============================================
  const loadFromLocalStorage = () => {
    try {
      const savedGeneral = JSON.parse(localStorage.getItem('general_settings') || '{}');
      const savedUnits = JSON.parse(localStorage.getItem('unit_settings') || '{}');
      const savedWarehouse = JSON.parse(localStorage.getItem('warehouse_settings') || '{}');
      const savedEmail = JSON.parse(localStorage.getItem('email_settings') || '{}');

      if (Object.keys(savedGeneral).length > 0) {
        setGeneralSettings(prev => ({ ...prev, ...savedGeneral }));
      }
      if (Object.keys(savedUnits).length > 0) {
        setUnitSettings(prev => ({ ...prev, ...savedUnits }));
      }
      if (Object.keys(savedWarehouse).length > 0) {
        setWarehouseSettings(prev => ({ ...prev, ...savedWarehouse }));
      }
      if (Object.keys(savedEmail).length > 0) {
        setEmailSettings(prev => ({ ...prev, ...savedEmail }));
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  };

  // =============================================
  // useEffect برای بارگذاری اولیه
  // =============================================
  useEffect(() => {
    fetchSettingsFromAPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============================================
  // تغییرات در فرم‌ها
  // =============================================
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleUnitChange = (e) => {
    const { name, value } = e.target;
    setUnitSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleWarehouseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWarehouseSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({ ...prev, [name]: value }));
  };

  // =============================================
  // ذخیره تنظیمات در localStorage (موقت)
  // =============================================
  const saveSettingsToLocalStorage = (section, data) => {
    try {
      localStorage.setItem(`${section}_settings`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      throw error;
    }
  };

  // =============================================
  // ارسال فرم‌ها
  // =============================================
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // TODO: اتصال به API واقعی
      // برای هر کلید، یک درخواست update بفرست
      // await settingsAPI.update('company_name', { value: generalSettings.company_name });

      saveSettingsToLocalStorage('general', generalSettings);
      setSuccess(t('general_settings_updated'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(t('error_saving_settings'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      saveSettingsToLocalStorage('unit', unitSettings);
      setSuccess(t('unit_settings_updated'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(t('error_saving_settings'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      saveSettingsToLocalStorage('warehouse', warehouseSettings);
      setSuccess(t('warehouse_settings_updated'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(t('error_saving_settings'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      saveSettingsToLocalStorage('email', emailSettings);
      setSuccess(t('email_settings_updated'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(t('error_saving_settings'));
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================
  // رندر
  // =============================================
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
          <h1>{t('settings')}</h1>
        </Col>
      </Row>

      {/* Messages */}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Tabs */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        {/* تب تنظیمات عمومی */}
        <Tab eventKey="general" title={t('general')}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleGeneralSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('company_name')} *</Form.Label>
                      <Form.Control
                        type="text"
                        name="company_name"
                        value={generalSettings.company_name}
                        onChange={handleGeneralChange}
                        required
                        placeholder={t('enter_company_name')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('company_website')}</Form.Label>
                      <Form.Control
                        type="url"
                        name="company_website"
                        value={generalSettings.company_website}
                        onChange={handleGeneralChange}
                        placeholder="https://example.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('company_email')}</Form.Label>
                      <Form.Control
                        type="email"
                        name="company_email"
                        value={generalSettings.company_email}
                        onChange={handleGeneralChange}
                        placeholder={t('enter_company_email')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('company_phone')}</Form.Label>
                      <Form.Control
                        type="text"
                        name="company_phone"
                        value={generalSettings.company_phone}
                        onChange={handleGeneralChange}
                        placeholder={t('enter_company_phone')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>{t('company_address')}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="company_address"
                    value={generalSettings.company_address}
                    onChange={handleGeneralChange}
                    placeholder={t('enter_company_address')}
                  />
                </Form.Group>

                <hr />

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('currency')}</Form.Label>
                      <Form.Select
                        name="currency"
                        value={generalSettings.currency}
                        onChange={handleGeneralChange}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="IRR">IRR (ریال)</option>
                        <option value="AED">AED (د.إ)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('currency_symbol')}</Form.Label>
                      <Form.Control
                        type="text"
                        name="currency_symbol"
                        value={generalSettings.currency_symbol}
                        onChange={handleGeneralChange}
                        maxLength={5}
                        placeholder="$"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('timezone')}</Form.Label>
                      <Form.Select
                        name="timezone"
                        value={generalSettings.timezone}
                        onChange={handleGeneralChange}
                      >
                        <option value="UTC">UTC</option>
                        <option value="Asia/Tehran">Asia/Tehran</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('date_format')}</Form.Label>
                      <Form.Select
                        name="date_format"
                        value={generalSettings.date_format}
                        onChange={handleGeneralChange}
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                        <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                        <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('time_format')}</Form.Label>
                      <Form.Select
                        name="time_format"
                        value={generalSettings.time_format}
                        onChange={handleGeneralChange}
                      >
                        <option value="HH:mm">24-Hour (HH:mm)</option>
                        <option value="hh:mm A">12-Hour (hh:mm A)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? t('saving') : t('save_settings')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* تب تنظیمات واحدها */}
        <Tab eventKey="units" title={t('units')}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleUnitSubmit}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('weight_unit')}</Form.Label>
                      <Form.Select
                        name="weight_unit"
                        value={unitSettings.weight_unit}
                        onChange={handleUnitChange}
                      >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="lb">Pound (lb)</option>
                        <option value="oz">Ounce (oz)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('dimension_unit')}</Form.Label>
                      <Form.Select
                        name="dimension_unit"
                        value={unitSettings.dimension_unit}
                        onChange={handleUnitChange}
                      >
                        <option value="cm">Centimeter (cm)</option>
                        <option value="m">Meter (m)</option>
                        <option value="in">Inch (in)</option>
                        <option value="ft">Foot (ft)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('volume_unit')}</Form.Label>
                      <Form.Select
                        name="volume_unit"
                        value={unitSettings.volume_unit}
                        onChange={handleUnitChange}
                      >
                        <option value="L">Liter (L)</option>
                        <option value="mL">Milliliter (mL)</option>
                        <option value="gal">Gallon (gal)</option>
                        <option value="qt">Quart (qt)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? t('saving') : t('save_settings')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* تب تنظیمات انبار */}
        <Tab eventKey="warehouse" title={t('warehouse_settings')}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleWarehouseSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('default_warehouse')}</Form.Label>
                      <Form.Select
                        name="default_warehouse"
                        value={warehouseSettings.default_warehouse}
                        onChange={handleWarehouseChange}
                      >
                        <option value="">{t('select_default_warehouse')}</option>
                        {/* در واقعیت باید لیست انبارها از API دریافت شود */}
                        <option value="1">Main Warehouse</option>
                        <option value="2">Secondary Warehouse</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('low_stock_threshold')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="low_stock_threshold"
                        value={warehouseSettings.low_stock_threshold}
                        onChange={handleWarehouseChange}
                        min="0"
                      />
                      <Form.Text className="text-muted">
                        {t('low_stock_threshold_description')}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="enable_auto_reorder"
                        label={t('enable_auto_reorder')}
                        checked={warehouseSettings.enable_auto_reorder}
                        onChange={handleWarehouseChange}
                      />
                      <Form.Text className="text-muted">
                        {t('auto_reorder_description')}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('reorder_quantity')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="reorder_quantity"
                        value={warehouseSettings.reorder_quantity}
                        onChange={handleWarehouseChange}
                        min="0"
                        disabled={!warehouseSettings.enable_auto_reorder}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? t('saving') : t('save_settings')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* تب تنظیمات ایمیل */}
        <Tab eventKey="email" title={t('email_settings')}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleEmailSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_driver')}</Form.Label>
                      <Form.Select
                        name="mail_driver"
                        value={emailSettings.mail_driver}
                        onChange={handleEmailChange}
                      >
                        <option value="smtp">SMTP</option>
                        <option value="sendmail">Sendmail</option>
                        <option value="mailgun">Mailgun</option>
                        <option value="postmark">Postmark</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_encryption')}</Form.Label>
                      <Form.Select
                        name="mail_encryption"
                        value={emailSettings.mail_encryption}
                        onChange={handleEmailChange}
                      >
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                        <option value="">None</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_host')}</Form.Label>
                      <Form.Control
                        type="text"
                        name="mail_host"
                        value={emailSettings.mail_host}
                        onChange={handleEmailChange}
                        placeholder="smtp.example.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_port')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="mail_port"
                        value={emailSettings.mail_port}
                        onChange={handleEmailChange}
                        placeholder="587"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_username')}</Form.Label>
                      <Form.Control
                        type="text"
                        name="mail_username"
                        value={emailSettings.mail_username}
                        onChange={handleEmailChange}
                        placeholder={t('enter_mail_username')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_password')}</Form.Label>
                      <Form.Control
                        type="password"
                        name="mail_password"
                        value={emailSettings.mail_password}
                        onChange={handleEmailChange}
                        placeholder={t('enter_mail_password')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_from_address')}</Form.Label>
                      <Form.Control
                        type="email"
                        name="mail_from_address"
                        value={emailSettings.mail_from_address}
                        onChange={handleEmailChange}
                        placeholder="noreply@example.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('mail_from_name')}</Form.Label>
                      <Form.Control
                        type="text"
                        name="mail_from_name"
                        value={emailSettings.mail_from_name}
                        onChange={handleEmailChange}
                        placeholder={t('enter_mail_from_name')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? t('saving') : t('save_settings')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Settings;