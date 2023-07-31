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
  HStack,
  Text,
  Stack,
  Center,
  Badge,
  chakra,
} from '@chakra-ui/react';
import { Reorder } from 'framer-motion';

import useSWR from 'swr';
import { DataModels } from '@5minds/processcube_engine_client';

const fetcher = (url: any) => fetch(url).then((res) => res.json());
const List = chakra(Reorder.Group);
const ListItem = chakra(Reorder.Item);

export const NotificationIcon = ({ onTaskClick }: { onTaskClick: (taskId: string) => void }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [tasks, setTasks] = useState([] as Array<DataModels.FlowNodeInstances.UserTaskInstance>);
  const [newTasks, setNewTasks] = useState([] as Array<DataModels.FlowNodeInstances.UserTaskInstance>);
  const [seenTasks, setSeenTasks] = useState([] as Array<DataModels.FlowNodeInstances.UserTaskInstance>);

  const { data: fetchedTasks, error: userTaskError } = useSWR('/api/usertasks', fetcher, {
    refreshInterval: 3000,
    onSuccess: (taskList) => {
      setTasks(taskList);
      updateNewTasks();
    },
  });

  // const { data: fetchedSeenTasks, error: newTasksError } = useSWR(
  //   '/api/usermetadata',
  //   () =>
  //     fetch('/api/usermetadata', {
  //       body: JSON.stringify({ flowNodeInstanceIds: tasks.map((task) => task.processInstanceId) }),
  //     }).then((res) => res.json()),
  //   {
  //     refreshInterval: 3000,
  //     onSuccess: (taskList) => {
  //       setSeenTasks(taskList);
  //       updateNewTasks();
  //     },
  //   }
  // );

  if (userTaskError) return <div>Error fetching data</div>;
  // if (!data) return <div>Loading...</div>;

  function updateNewTasks() {
    const newTasks = tasks.filter((task) => !seenTasks.includes(task));
    setNewTasks(newTasks);
    setNotificationCount(newTasks.length);
  }

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
          <PopoverContent color="black" bg="gray.100" borderColor="blue.800">
            <PopoverHeader pt={4} fontWeight="bold" border="0">
              Neue Aufgaben
            </PopoverHeader>
            <PopoverArrow bg="blue.800" />
            <PopoverCloseButton />
            <PopoverBody>
              <Center maxW="sm" mx="auto" py={{ base: '4', md: '8' }}>
                <Stack spacing="5" flex="1">
                  <List values={newTasks} onReorder={setNewTasks} listStyleType="none">
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
                            cursor="grab"
                            whileTap={{ cursor: 'grabbing', scale: 1.1 }}
                          >
                            <Stack shouldWrapChildren spacing="4">
                              <Text textStyle="sm" fontWeight="medium" color="fg.emphasized">
                                {task.flowNodeId}
                              </Text>
                              <HStack justify="space-between">
                                {/* <Badge colorScheme={task.type === 'Feature' ? 'green' : 'red'} size="sm">
                                    {task.type}
                                  </Badge> */}
                                <HStack spacing="3">
                                  <Text textStyle="xs" color="fg.subtle" fontWeight="medium">
                                    {task.flowNodeInstanceId}
                                  </Text>
                                  <Button
                                    size="xs"
                                    colorScheme="blue"
                                    onClick={() => onTaskClick(task.flowNodeInstanceId)}
                                  >
                                    X
                                  </Button>
                                </HStack>
                              </HStack>
                            </Stack>
                          </ListItem>
                        ) : null
                      )}
                    </Stack>
                  </List>
                </Stack>
              </Center>
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
