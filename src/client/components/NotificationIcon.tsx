import React, { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import {
  IconButton,
  Box,
  Flex,
  Popover,
  Button,
  PopoverHeader,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  PopoverTrigger,
  ButtonGroup,
  PopoverFooter,
  ChakraProvider,
  Card,
  CardHeader,
  Heading,
  CardBody,
} from '@chakra-ui/react';

import useSWR from 'swr';
import { DataModels } from '@5minds/processcube_engine_client';

const fetcher = (url: any) => fetch(url).then((res) => res.json());

export const NotificationIcon = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [taskList, setTaskList] = useState([]);

  const { data, error } = useSWR('/api/usertasks', fetcher, {
    refreshInterval: 3000,
    onSuccess: (taskList) => {
      console.log('taskList', taskList);
      setNotificationCount(taskList.length);
      setTaskList(taskList);
    },
  });

  const handleClick = (task: DataModels.FlowNodeInstances.UserTaskInstance) => {
    console.log('handleClick', task);
  };

  if (error) return <div>Error fetching data</div>;
  // if (!data) return <div>Loading...</div>;

  return (
    <ChakraProvider>
      <Box>
        <Popover placement="bottom" closeOnBlur={false}>
          <PopoverTrigger>
            <Flex position="relative" align="center">
              <IconButton icon={<FiBell fontSize="1.25rem" />} aria-label="Settings" bg="gray.300" />
              {notificationCount > 0 && (
                <Box
                  bg="red"
                  w="20px"
                  h="20px"
                  borderRadius="50%"
                  position="absolute"
                  top="-10px"
                  right="-10px"
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
          </PopoverTrigger>
          <PopoverContent color="white" bg="blue.800" borderColor="blue.800">
            <PopoverHeader pt={4} fontWeight="bold" border="0">
              Neue Aufgaben
            </PopoverHeader>
            <PopoverArrow bg="blue.800" />
            <PopoverCloseButton />
            <PopoverBody>
              <Box>
                {taskList.map((task: DataModels.FlowNodeInstances.UserTaskInstance) => (
                  <Box as="section" py={{ base: '4', md: '8' }} minW={{ base: '100%', md: '60%' }}>
                    <Card
                      variant="elevated"
                      direction={{ base: 'column', md: 'row' }}
                      justify={{ base: 'space-between' }}
                      overflow="hidden"
                    >
                      <CardHeader>
                        <Heading size="sm">{task.processModelId}</Heading>
                      </CardHeader>
                      <CardBody textAlign="right">
                        <Button variant="primary" onClick={() => handleClick(task)}>
                          {task.flowNodeName}
                        </Button>
                      </CardBody>
                    </Card>
                  </Box>
                ))}
              </Box>
            </PopoverBody>
            <PopoverFooter border="0" display="flex" alignItems="center" justifyContent="space-between" pb={4}>
              <ButtonGroup size="sm" ml="auto">
                <Button colorScheme="green">Alle Aufgaben als gelesen markieren</Button>
              </ButtonGroup>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </Box>
    </ChakraProvider>
  );
};
