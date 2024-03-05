import type {
  UserTaskList as EngineSDKUserTaskList,
  UserTaskInstance as EngineSDKUserTaskInstance,
  UserTaskFormField,
  UserTaskConfig as EngineSDKUserTaskConfig,
  UserTaskConfigModel as EngineSDKUserTaskConfigModel,
} from '@5minds/processcube_engine_sdk';

export type FormFieldsDict = {
  [formFieldId: string]: UserTaskFormField;
};
export type UserTaskConfig = EngineSDKUserTaskConfig & { formFieldsDict: FormFieldsDict };
export type UserTaskConfigModel = EngineSDKUserTaskConfigModel & { formFieldsDict: FormFieldsDict };

export type UserTaskInstance = Omit<EngineSDKUserTaskInstance, 'userTaskConfig' | 'userTaskConfigModel'> & {
  userTaskConfig: UserTaskConfig;
  userTaskConfigModel: UserTaskConfigModel;
};
export type UserTaskList = {
  userTasks: Array<UserTaskInstance>;
  totalCount: number;
};

export function mapUserTask(userTaskInstance: EngineSDKUserTaskInstance): UserTaskInstance {
  const { userTaskConfig, userTaskConfigModel, ...remainingInstance } = userTaskInstance;

  const configFormFieldsDict: FormFieldsDict = {};
  const modelFormFieldsDict: FormFieldsDict = {};
  userTaskConfig.formFields.forEach((formField) => (configFormFieldsDict[formField.id] = formField));
  userTaskConfigModel.formFields.forEach((formField) => (modelFormFieldsDict[formField.id] = formField));

  return {
    ...remainingInstance,
    userTaskConfig: { ...userTaskConfig, formFieldsDict: configFormFieldsDict },
    userTaskConfigModel: { ...userTaskConfigModel, formFieldsDict: modelFormFieldsDict },
  };
}

export function mapUserTaskList(userTaskList: EngineSDKUserTaskList): UserTaskList {
  return {
    totalCount: userTaskList.totalCount,
    userTasks: userTaskList.userTasks.map(mapUserTask),
  };
}
