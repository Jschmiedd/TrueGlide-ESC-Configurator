import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { CookieBanner } from '@palmabit/react-cookie-law';

import { accept } from './cookieSlice';

function CookieConsent() {
  const { t } = useTranslation('common');
  const dispatch = useDispatch();

  const handleCookieAccept = useCallback(() => {
    dispatch(accept());
  }, [dispatch]);

  return (
    <CookieBanner
      acceptButtonText={t('cookieAccept')}
      managePreferencesButtonText={t('cookieManage')}
      marketingOptionText={t('cookieMarketing')}
      message={t('cookieText')}
      necessaryOptionText={t('cookieNecessary')}
      onAccept={handleCookieAccept}
      preferencesOptionText={t('cookiePreferences')}
      privacyPolicyLinkText=""
      savePreferencesButtonText={t('cookieSave')}
      statisticsOptionText={t('cookieStatistics')}
      styles={{
        dialog: {
          bottom: 0,
          top: 'auto',
          position: 'fixed',
          width: '100%',
          paddingBottom: '20px',
          paddingTop: '20px',
          background: 'white',
          borderTop: 'solid 2px black',
          zIndex: 2,
        },
        message: {
          marginLeft: '20px',
          marginRight: '20px',
          fontSize: '16px',
          marginBottom: '10px',
        },
        button: {
          padding: '7px',
          margin: '5px',
          marginTop: '10px',
          marginRight: '20px',
          cursor: 'pointer',
          background: 'black',
          color: 'white',
        },
        policy: {
          display: 'inline-block',
          lineHeight: '30px',
          fontSize: '14px',
        },
      }}
    />
  );
}

export default React.memo(CookieConsent);
