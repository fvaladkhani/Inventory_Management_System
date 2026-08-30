import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { transactionTypesAPI } from '../services/api';
import LookupManager from '../components/LookupManager';

const TransactionTypes = () => {
  const { t } = useTranslation();

  return (
    <LookupManager
      title={t('transaction_types')}
      api={transactionTypesAPI}
      fields={[
        { name: 'type_name', label: t('name'), required: true },
        { name: 'description', label: t('description'), type: 'textarea' },
      ]}
      primaryKey="type_id"
      listFields={[
        { key: 'type_id', label: '#' },
        { key: 'type_name', label: t('name') },
        { key: 'description', label: t('description') },
      ]}
    />
  );
};

export default TransactionTypes;