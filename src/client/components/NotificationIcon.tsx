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

export const NotificationIcon = ({
  onTaskClick,
  loadingComponent = null,
}: {
  onTaskClick: (taskId: string) => void;
  loadingComponent: any;
}) => {
  const [newTasks, setNewTasks] = useState([] as Array<DataModels.FlowNodeInstances.UserTaskInstance>);

  const { data, error } = useSWR('/api/usertasks', fetcher, {
    refreshInterval: 3000,
    onSuccess: (taskList) => {
      setNewTasks(taskList);
    },
  });

  if (error) return <div>Error fetching data</div>;
  if (!data && loadingComponent) return loadingComponent;

  return (
    <ChakraProvider>
      <Box>
        <Popover placement="right-end" closeOnBlur={false}>
          <PopoverTrigger>
            <Flex position="relative" align="center">
              <IconButton icon={<FiBell fontSize="1.25rem" />} aria-label="Settings" bg="gray.300" />
              {newTasks.length > 0 && (
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
                                    <Button
                                      size="xs"
                                      colorScheme="blue"
                                      onClick={() => onTaskClick(task.flowNodeInstanceId)}
                                    >
                                      X
                                    </Button>
                                  </Flex>
                                  <Text textStyle="xs" color="fg.subtle" fontWeight="medium">
                                    {task.flowNodeName}
                                  </Text>
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
