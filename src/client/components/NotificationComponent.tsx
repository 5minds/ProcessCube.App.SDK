import React, { useEffect, useState } from 'react';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { IconButton } from '@chakra-ui/react';

export const NotificationComponent = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const interval = setInterval(sendNotification, 3000);

    return () => clearInterval(interval);
  }, [showNotifications]);

  const sendNotification = () => {
    if (showNotifications) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new window.Notification('Hello!', {
            body: 'This is a notification sent via the Notification API.',
          });
          console.log('Notification sent!');
        }
      });
    }
  };

  return (
    <IconButton
      icon={showNotifications ? <FiBell fontSize="1.25rem" /> : <FiBellOff fontSize="1.25rem" />}
      aria-label="Settings"
      onClick={() => setShowNotifications(!showNotifications)}
    />
  );
};
