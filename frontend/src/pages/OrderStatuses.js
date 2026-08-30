import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderStatusesAPI } from '../services/api';
import LookupManager from '../components/LookupManager';

const OrderStatuses = () => {
  const { t } = useTranslation();

  return (
    <LookupManager
      title={t('order_statuses')}
      api={orderStatusesAPI}
      fields={[
        { name: 'status_name', label: t('name'), required: true },
        { name: 'description', label: t('description'), type: 'textarea' },
      ]}
      primaryKey="status_id"
      listFields={[
        { key: 'status_id', label: '#' },
        { key: 'status_name', label: t('name') },
        { key: 'description', label: t('description') },
      ]}
    />
  );
};

export default OrderStatuses;