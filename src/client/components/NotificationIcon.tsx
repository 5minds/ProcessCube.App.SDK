import React, { useEffect, useState } from 'react';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { IconButton, Icon, Box, Badge, Flex, Text, Popover, Button, PopoverHeader, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverBody, PopoverTrigger, ButtonGroup, PopoverFooter } from '@chakra-ui/react';

import useSWR from 'swr';

const fetcher = (url: any) => fetch(url).then((res) => res.json());

export const NotificationIcon = () => {
  const [notificationCount, setNotificationCount] = useState(0);

  const { data, error } = useSWR('/api/usertasks', fetcher, {
    refreshInterval: 3000,
    onSuccess: (data) => {
      console.log('data', data);
      setNotificationCount(data.length);
    },
  });

  if (error) return <div>Error fetching data</div>;
  if (!data) return <div>Loading...</div>;

  return (
    // <Flex position="relative" align="center">
    //   <IconButton
    //     icon={<FiBell fontSize="1.25rem" /> }
    //     aria-label="Settings"
    //     onClick={() => console.log('clicked')}
    //   />
    //   {notificationCount > 0 && (
    //     <Box
    //       bg="red"
    //       w="16px"
    //       h="16px"
    //       borderRadius="50%"
    //       position="absolute"
    //       top="-8px"
    //       right="-8px"
    //       display="flex"
    //       justifyContent="center"
    //       alignItems="center"
    //       fontSize="0.8rem"
    //       color="white"
    //     >
    //       {notificationCount}
    //     </Box>
    //   )}
    // </Flex>

    <Box>
      <Popover placement="bottom" closeOnBlur={false}>
        <PopoverTrigger>
          <Button>Trigger</Button>
        </PopoverTrigger>
        <PopoverContent color="white" bg="blue.800" borderColor="blue.800">
          <PopoverHeader pt={4} fontWeight="bold" border="0">
            Manage Your Channels
          </PopoverHeader>
          <PopoverArrow bg="blue.800" />
          <PopoverCloseButton />
          <PopoverBody>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et
            dolore.
          </PopoverBody>
          <PopoverFooter border="0" display="flex" alignItems="center" justifyContent="space-between" pb={4}>
            <Box fontSize="sm">Step 2 of 4</Box>
            <ButtonGroup size="sm">
              <Button colorScheme="green">Setup Email</Button>
              <Button colorScheme="blue">Next</Button>
            </ButtonGroup>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </Box>
  );
};
