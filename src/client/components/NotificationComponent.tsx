import React, { useEffect, useState } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
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
  ChakraProvider,
  ListItem,
  Text,
  Center,
  List,
  Stack,
} from '@chakra-ui/react';

import useSWR from 'swr';
import { DataModels } from '@5minds/processcube_engine_client';

const fetcher = (url: any) => fetch(url).then((res) => res.json());

export const NotificationComponent = ({
  onTaskClick,
  newTasksApiUrl,
  refreshInterval = 5000,
  theme = {},
  fontSize = '1.5rem',
  badgeTop = '-10px',
  badgeRight = '-10px',
  loadingComponent = null,
  errorComponent = null,
}: {
  onTaskClick: (taskId: string) => void;
  newTasksApiUrl: string;
  refreshInterval?: number;
  theme?: Record<string, any>;
  fontSize?: string;
  badgeTop?: string;
  badgeRight?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}) => {
  const [newTasks, setNewTasks] = useState([] as Array<DataModels.FlowNodeInstances.UserTaskInstance>);
  Notification.requestPermission().then((result) => {
    console.log(result);
  });

  useEffect(() => {
    socketInitializer();
  }, []);

  const shownTaskIds = new Set(JSON.parse(localStorage.getItem('shownTaskIds') as any) || []);

  let socket: any;
  const socketInitializer = async () => {
    // We call this just to make sure we turn on the websocket server
    await fetch('/api/socket');

    socket = io('', {
      path: '/api/socket/io',
    });

    socket.on('connect', () => {
      console.log('Connected', socket.id);
    });

    socket.on('newIncomingMessage', (msg: any) => {
      console.log('New message in client', msg);
    });
  };

  const { data, error } = useSWR(newTasksApiUrl, fetcher, {
    refreshInterval,
    refreshWhenHidden: true,
    onSuccess: (taskList: Array<DataModels.FlowNodeInstances.UserTaskInstance>) => {
      setNewTasks(taskList);
      taskList.forEach((task) => {
        if (!shownTaskIds.has(task.flowNodeInstanceId)) {
          shownTaskIds.add(task.flowNodeInstanceId);

          const notificationInstance = new Notification(task.processModelId, {
            body: task.flowNodeName,
            tag: task.flowNodeInstanceId,
          });

          notificationInstance.onclose = () => {
            shownTaskIds.delete(task.flowNodeInstanceId);
            onTaskClick(task.flowNodeInstanceId);
          };
        }
      });

      localStorage.setItem('shownTaskIds', JSON.stringify([...shownTaskIds]));
    },
  });

  if (error && errorComponent) return errorComponent;
  if (!data && loadingComponent) return loadingComponent;

  return (
    <ChakraProvider theme={theme}>
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
                                      onClick={() => {
                                        onTaskClick(task.flowNodeInstanceId);
                                        shownTaskIds.delete(task.flowNodeInstanceId);
                                        setNewTasks(
                                          newTasks.filter((t) => t.flowNodeInstanceId !== task.flowNodeInstanceId)
                                        );
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
                            ) : null
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
    </ChakraProvider>
  );
};
