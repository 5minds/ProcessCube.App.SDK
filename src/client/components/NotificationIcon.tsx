import React, { useEffect, useState } from 'react';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { BsDot } from 'react-icons/bs';
import { IconButton, Icon, Box, Badge, Flex, Text } from '@chakra-ui/react';

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export const NotificationIcon = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const { data, error } = useSWR('http://worldtimeapi.org/api/timezone/America/New_York', fetcher, {
    refreshInterval: 5000,
    onSuccess: (data) => {
      if (data && data.datetime) {
        const unixTime = new Date(data.datetime).getTime() / 1000;
        const lastTwoDigits = Math.floor(unixTime % 100);
        setNotificationCount(lastTwoDigits);
      }
    },
  });

  if (error) return <div>Error fetching data</div>;
  if (!data) return <div>Loading...</div>;

  const currentTime = new Date(data.datetime).toLocaleString();

  // const sendNotification = () => {
  //   setNotificationCount((prev) => prev + 1);

  //   if (showNotifications) {
  //     Notification.requestPermission().then((permission) => {
  //       if (permission === 'granted') {
  //         new window.Notification('Hello!', {
  //           body: 'This is a notification sent via the Notification API.',
  //         });
  //         console.log('Notification sent!');
  //       }
  //     });
  //   }
  // };


  return (
    <Flex position="relative" align="center">
      <IconButton
        icon={showNotifications ? <FiBell fontSize="1.25rem" /> : <FiBellOff fontSize="1.25rem" />}
        aria-label="Settings"
        onClick={() => setShowNotifications((prev) => !prev)}
      />
      {showNotifications && notificationCount > 0 && (
        <Box
          bg="red"
          w="16px"
          h="16px"
          borderRadius="50%"
          position="absolute"
          top="-8px"
          right="-8px"
          display="flex"
          justifyContent="center"
          alignItems="center"
          fontSize="0.8rem"
          color="white"
        >
          {notificationCount}
        </Box>
      )}
    </Flex>
  );
};
