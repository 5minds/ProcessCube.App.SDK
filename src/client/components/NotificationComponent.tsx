import React, { useEffect, useRef, useState } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import {
  IconButton,
  Box,
  Flex,
  Popover,
  PopoverHeader,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  PopoverTrigger,
  ChakraProvider,
  ListItem,
  Text,
  Center,
  List,
  Stack,
} from '@chakra-ui/react';

import io from 'socket.io-client';
import { DataModels } from '@5minds/processcube_engine_client';

let socket: any;

export const NotificationComponent = ({
  onTaskClick,
  theme = {},
  fontSize = '1.5rem',
  badgeTop = '-10px',
  badgeRight = '-10px',
  loadingComponent = null,
  errorComponent = null,
}: {
  onTaskClick?: (taskId: string) => void;
  theme?: Record<string, any>;
  fontSize?: string;
  badgeTop?: string;
  badgeRight?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}) => {
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [newTasks, setNewTasks] = useState([] as Array<DataModels.FlowNodeInstances.UserTaskInstance>);
  const [userId, setUserId] = useState('');
  Notification.requestPermission().then((result) => {
    // console.log(result);
  });

  const socketRef = useRef<SocketIOClient.Socket>();

  const socketInitializer = async () => {
    if (!userId || userId === '') {
      const userId = await getUserId();
      console.log('USERID', userId);
      setUserId(userId);
    }

    console.log('socketInitializer', userId);

    await fetch('/api/socket');

    if (socketRef.current === undefined) {
      socketRef.current = io('', {
        path: '/api/socket/io' || '',
        transports: ['websocket', 'polling'],
        query: { userId },
      });
    }

    socketRef.current.on('connect', () => {
      console.log('Connected', socket.id);
    });

    socketRef.current.on('waitingTasks', (usertasks: Array<DataModels.FlowNodeInstances.UserTaskInstance>) => {
      if (!socketInitialized) {
        console.log(usertasks.length);
        console.log('waitingTasks', usertasks);
        setNewTasks(usertasks);
        setSocketInitialized(true);
      }
    });

    // socket.on('newUserTaskWaiting', (usertask: DataModels.FlowNodeInstances.UserTaskInstance) => {
    //   console.log('newTasks', newTasks);
    //   setNewTasks([...newTasks, usertask]);
    // });

    socketRef.current.on('removeTask', (taskId: string) => {
      setNewTasks(newTasks.filter((task) => task.flowNodeInstanceId !== taskId));
    });

    socketRef.current.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  };

  const getUserId = async () => {
    const response = await fetch('http://localhost:3000/api/userid');
    let userId = await response.text();
    userId = userId.replace(/"/g, '');

    return userId;
  };

  useEffect(() => {
    console.log(typeof window);
    socketInitializer();

    console.log('useEffect', newTasks);

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [newTasks, socketInitialized, userId]);

  return (
    <ChakraProvider theme={theme}>
      {!socketInitialized && loadingComponent}
      {socketInitialized && (
        <Box>
          <Popover placement="right-end" closeOnBlur={false}>
            <PopoverTrigger>
              <Flex position="relative" align="center">
                <IconButton icon={<FiBell fontSize={fontSize} />} aria-label="Settings" />
                {newTasks.length > 0 && (
                  <Box
                    bg="red"
                    w="20px"
                    h="20px"
                    borderRadius="50%"
                    position="absolute"
                    top={badgeTop}
                    right={badgeRight}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    fontSize="0.8rem"
                    color="white"
                  >
                    {newTasks.length}
                  </Box>
                )}
              </Flex>
            </PopoverTrigger>
            <PopoverContent color="black" bg="gray.100" borderColor="blue.800">
              {newTasks.length === 0 && (
                <>
                  <PopoverHeader pt={4} fontWeight="bold" border="0">
                    Keine neuen Aufgaben
                  </PopoverHeader>
                  <PopoverArrow bg="blue.800" />
                  <PopoverCloseButton />
                </>
              )}
              {newTasks.length > 0 && (
                <>
                  <PopoverHeader pt={4} fontWeight="bold" border="0">
                    Neue Aufgaben
                  </PopoverHeader>
                  <PopoverArrow bg="blue.800" />
                  <PopoverCloseButton />
                  <PopoverBody>
                    <Center maxW="sm" mx="auto" py={{ base: '4', md: '8' }}>
                      <Stack spacing="5" flex="1">
                        <List listStyleType="none">
                          <Stack spacing="3" width="full">
                            {newTasks.map((task) =>
                              task ? (
                                <ListItem
                                  key={task.flowNodeInstanceId}
                                  value={task.flowNodeInstanceId}
                                  backgroundColor="white"
                                  p="4"
                                  boxShadow="sm"
                                  position="relative"
                                  borderRadius="lg"
                                >
                                  <Stack shouldWrapChildren spacing="4">
                                    <Flex justify="space-between" alignItems="center">
                                      <Text textStyle="sm" fontWeight="medium" color="fg.emphasized">
                                        {task.processModelId}
                                      </Text>
                                      <IconButton
                                        size="xs"
                                        icon={<FiX />}
                                        aria-label="close"
                                        color={'gray.900'}
                                        onClick={async () => {
                                          socket.emit('taskSeen', userId, task.flowNodeInstanceId);
                                        }}
                                      />
                                    </Flex>
                                    <Flex justify="space-between" alignItems="center">
                                      <Text textStyle="xs" color="fg.subtle" fontWeight="medium">
                                        {task.flowNodeName}
                                      </Text>
                                      {task.startedAt && (
                                        <Text textStyle="xs" color="gray.500" textAlign="right">
                                          {new Date(task.startedAt).toLocaleString(undefined, {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                          })}
                                        </Text>
                                      )}
                                    </Flex>
                                  </Stack>
                                </ListItem>
                              ) : null,
                            )}
                          </Stack>
                        </List>
                      </Stack>
                    </Center>
                  </PopoverBody>
                </>
              )}

              {/* <PopoverFooter border="0" display="flex" alignItems="center" justifyContent="space-between" pb={4}>
              <ButtonGroup size="sm" ml="auto">
                <Button colorScheme="green">Alle Aufgaben als gelesen markieren</Button>
              </ButtonGroup>
            </PopoverFooter> */}
            </PopoverContent>
          </Popover>
        </Box>
      )}
    </ChakraProvider>
  );
};
