import React, { Fragment, PropsWithChildren, forwardRef, useRef } from 'react';
import { DataModels } from '@5minds/processcube_engine_sdk';
import * as ReactIs from 'react-is';
import { Menu, Transition } from '@headlessui/react';
import {
  FormFieldComponentMap,
  type DynamicUiFormFieldComponentMap,
  type GenericFormFieldTypeComponentMap,
} from './FormFields';
import { classNames } from '../../utils/classNames';
import { parseCustomFormConfig } from './utils/parseCustomFormConfig';

// TODO: Alert vom alten Portal Aufbau anschauen
// TODO: überschriebene Styles anpassen
// TODO: components überschreibbar machen siehe react-select

interface DynamicUiForwardedRefRenderFunction
  extends React.ForwardRefRenderFunction<DynamicUiRefFunctions, DynamicUiComponentProps> {
  (props: DynamicUiComponentProps, ref: DynamicUiFormFieldRef): React.ReactNode;
}
type DynamicUiComponentType = React.ComponentClass<DynamicUiComponentProps>;
export type DynamicUiFormFieldComponent =
  | DynamicUiForwardedRefRenderFunction
  | typeof DynamicUiComponent<DynamicUiComponentProps, {}>;

type DynamicUiRefFunctions = Omit<DynamicUiComponent, keyof React.Component>;
type FormFieldRenderer =
  | React.ForwardRefExoticComponent<DynamicUiComponentProps & React.RefAttributes<DynamicUiRefFunctions>>
  | DynamicUiComponentType;
type FormFieldRefsMapObj = {
  ref: React.MutableRefObject<DynamicUiRefFunctions | null>;
};
type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
type JSONObject = { [member: string]: JSONValue };
interface JSONArray extends Array<JSONValue> {}

export abstract class DynamicUiComponent<
  P extends DynamicUiComponentProps = DynamicUiComponentProps,
  S = {},
  SS = any,
> extends React.Component<P, S, SS> {
  getValue?(): JSONValue | void;
  getState?(): JSONValue | void;
}
export type DynamicUiFormFieldRef = React.ForwardedRef<DynamicUiRefFunctions>;
export type DynamicUiComponentProps<TState = any> = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: TState;
};
export type UserTaskResult = DataModels.FlowNodeInstances.UserTaskResult;
export type FormState = {
  [formFieldId: string]: JSONValue;
};

export function DynamicUi(
  props: PropsWithChildren<{
    task: DataModels.FlowNodeInstances.UserTaskInstance;
    onSubmit: (result: UserTaskResult, rawFormData: FormData) => Promise<void>;
    showHeaderMenu?: boolean;
    onSuspend?: () => void | Promise<void>;
    showTerminateOption?: boolean;
    onTerminate?: () => void | Promise<void>;
    className?: string;
    classNames?: Partial<Record<'wrapper' | 'base' | 'header' | 'body' | 'footer', string>>;
    title?: React.ReactNode;
    customFieldComponents?: DynamicUiFormFieldComponentMap;
    state?: FormState;
    onStateChange?: (newValue: string, formFieldId: string, formState: FormState) => void | Promise<void>;
  }>,
) {
  const { userTaskConfig: config } = props.task;
  const { formFields } = config;
  const timeoutRef = useRef<number>();
  const formRef = useRef<HTMLFormElement>(null);
  const formFieldRefs = new Map<string, FormFieldRefsMapObj>(
    formFields.map((field) => [field.id, { ref: React.createRef<DynamicUiRefFunctions>() }]),
  );

  const moreThanOneConfirm = formFields.filter((field) => field.type === 'confirm').length > 1;
  if (moreThanOneConfirm) {
    console.warn(
      `[@5minds/processcube_app_sdk:DynamicUi]\t\tWarning while rendering UserTask "${props.task.flowNodeId}"!\n The UserTask has more than one confirm form field. Please use only one confirm form field per User Task.\n\nThe first confirm form field is used for rendering.`,
    );
  }

  const confirmFormField = formFields.find((field) => field.type === 'confirm');

  // ein und auskommentieren für den style check
  const formFieldComponentMap = {
    ...FormFieldComponentMap,
    ...(props.customFieldComponents ? props.customFieldComponents : {}),
  };

  const onSubmit = (formData: FormData) => {
    const userTaskResult = transformFormDataToUserTaskResult(formData, formFields, formFieldRefs);

    props.onSubmit(userTaskResult, formData);
  };

  const onSuspend = () => {
    props.onSuspend?.();
  };

  function onFormDataChange(event: React.FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement;
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = undefined;
      if (formRef.current == null) {
        return;
      }
      const formData = new FormData(formRef.current);
      const formState = transformFormDataToFormState(formData, formFieldRefs);
      props.onStateChange?.(target.value, target.name, formState);
    }, 100);
  }

  return (
    <div
      className={classNames(
        'dark:shadow-dynamicui-gray-300 mx-auto block h-full min-h-[200px] rounded-lg shadow-lg shadow-[color:var(--uic-shadow-color)] sm:w-full sm:max-w-lg',
        props.classNames?.wrapper ? props.classNames?.wrapper : '',
        props.className ? props.className : '',
      )}
      data-dynamic-ui
    >
      <form
        ref={formRef}
        className={classNames(
          'dark:bg-dynamicui-gray-500 dark:text-dynamicui-gray-50 dark:shadow-dynamicui-gray-300 flex max-h-full flex-col rounded-lg bg-[color:var(--uic-background-color)]  text-[color:var(--uic-text-color)] shadow-lg shadow-[color:var(--uic-shadow-color)]',
          props.classNames?.base ? props.classNames?.base : '',
        )}
        data-user-task-id={props.task.flowNodeId}
        data-user-task-instance-id={props.task.flowNodeInstanceId}
        onChange={onFormDataChange}
        action={onSubmit}
      >
        <header
          className={classNames('px-4 pb-3 pt-4 sm:px-6', props.classNames?.header ? props.classNames.header : '')}
        >
          <Headline
            title={props.title ?? props.task.flowNodeName ?? 'User Task'}
            onSuspend={onSuspend}
            showHeaderMenu={props.showHeaderMenu}
            showTerminateOption={props.showTerminateOption}
            onTerminate={props.onTerminate}
          />
        </header>
        <section
          className={classNames(
            'overflow-y-auto px-4 py-3 sm:px-6',
            props.classNames?.body ? props.classNames.body : '',
          )}
        >
          <div className="flex flex-col space-y-6 dark:[color-scheme:dark]">
            {formFields.map((field) => {
              const DynamicUiFormFieldComponent = (formFieldComponentMap as GenericFormFieldTypeComponentMap)[
                field.type
              ];

              if (DynamicUiFormFieldComponent) {
                if (!ReactIs.isValidElementType(DynamicUiFormFieldComponent)) {
                  console.warn(
                    `[@5minds/processcube_app_sdk:DynamicUi]\t\tThe given DynamicUiFormFieldComponent is not a valid React Element Type.\n\nFormField:\t${JSON.stringify(
                      field,
                      null,
                      2,
                    )}\nDynamicUiFormFieldComponent:\t${DynamicUiFormFieldComponent.toString()}\n\nRendering 'null' as fallback`,
                  );
                  return null;
                }

                let ReactElement: FormFieldRenderer;
                if (isReactClassComponent(DynamicUiFormFieldComponent)) {
                  assertElementIsReactComponent(DynamicUiFormFieldComponent);
                  ReactElement = DynamicUiFormFieldComponent;
                } else {
                  let formFieldComponentToUse = DynamicUiFormFieldComponent;

                  // has only one parameter => wrap to function with two params because, forwardRef needs 0 or 2.
                  if (DynamicUiFormFieldComponent.length === 1) {
                    formFieldComponentToUse = (props: DynamicUiComponentProps, ref: DynamicUiFormFieldRef) => (
                      <DynamicUiFormFieldComponent {...props} />
                    );
                  }

                  assertElementIsRenderFunction(formFieldComponentToUse);
                  ReactElement = forwardRef(formFieldComponentToUse);
                }

                const ref = formFieldRefs.get(field.id)?.ref;

                return (
                  <Fragment key={field.id}>
                    <ReactElement ref={ref} formField={field} state={props.state?.[field.id]} />
                  </Fragment>
                );
              }

              'rounded-b-lg bg-[color:var(--uic-footer-background-color)] px-4 py-3 sm:px-6',
  );
}

function FormButtons(props: { confirmFormField?: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { confirmFormField } = props;

  let buttons: React.ReactNode = (
    <Fragment>
      <button
        type="submit"
        className="inline-flex w-full justify-center rounded-md border border-transparent bg-[color:var(--uic-footer-continue-button-background-color)] px-3 py-2 text-base font-medium leading-4 text-[color:var(--uic-footer-continue-button-text-color)] shadow-sm hover:bg-[color:var(--uic-footer-continue-button-background-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-footer-continue-button-focus-outline-color)] focus:ring-offset-2 sm:ml-2 sm:w-auto sm:text-sm "
      >
        OK
      </button>
    </Fragment>
  );
  if (confirmFormField) {
    const parsedConfirmFormFieldConfig = parseCustomFormConfig(confirmFormField.customForm);

    buttons = (
      <Fragment>
        <button
          type="submit"
          name={confirmFormField.id}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-[color:var(--uic-footer-continue-button-background-color)] px-3 py-2 text-base font-medium leading-4 text-[color:var(--uic-footer-continue-button-text-color)] shadow-sm hover:bg-[color:var(--uic-footer-continue-button-background-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-footer-continue-button-focus-outline-color)] focus:ring-offset-2 sm:ml-2 sm:w-auto sm:text-sm "
          value="true"
        >
          {parsedConfirmFormFieldConfig?.confirmButtonText ?? 'Confirm'}
        </button>
        <button
          type="submit"
          name={confirmFormField.id}
          className="inline-flex w-full justify-center rounded-md border border-[color:var(--uic-border-color)] bg-[color:var(--uic-footer-decline-button-background-color)] px-3 py-2 text-base font-medium leading-4 text-[color:var(--uic-footer-decline-button-text-color)] shadow-sm hover:bg-[color:var(--uic-footer-decline-button-background-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-footer-decline-button-focus-outline-color)] focus:ring-offset-2 sm:ml-2 sm:w-auto sm:text-sm dark:border-transparent"
          value="false"
        >
          {parsedConfirmFormFieldConfig?.declineButtonText ?? 'Decline'}
        </button>
      </Fragment>
    );
  }
  return <div className="space-y-2 sm:flex sm:flex-row-reverse sm:-space-x-2 sm:space-y-0">{buttons}</div>;
}

function Headline(props: {
  title?: React.ReactNode;
  onSuspend?: () => void;
  onTerminate?: () => void | Promise<void>;
  showTerminateOption?: boolean;
  showHeaderMenu?: boolean;
}) {
  const showHeaderMenu = props.showHeaderMenu ?? true;

  return (
    <div className="flex space-x-3">
      <div className="flex-1">
        <h3
          id="headline-title"
          className="dark:text-dynamicui-gray-150 text-lg font-medium leading-6 text-[color:var(--uic-header-text-color)]"
        >
          {props.title}
        </h3>
      </div>
      <div className="flex self-center">
        {showHeaderMenu && (
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="dark:text-dynamicui-gray-150 dark:hover:text-dynamicui-gray-100 flex items-center rounded-full text-[color:var(--uic-header-dropdown-icon-text-color)] hover:text-[color:var(--uic-header-dropdown-icon-text-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-focus-color)]  ">
                <span className="sr-only">Open options</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="dark:bg-dynamicui-gray-400 absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-[color:var(--uic-header-dropdown-menu-background-color)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => props.onSuspend?.()}
                        className={classNames(
                          active ? 'dark:bg-dynamicui-gray-250 bg-gray-100' : '',
                          'dark:text-dynamicui-gray-50 block w-full px-4 py-2 text-left text-sm text-gray-700',
                        )}
                      >
                        Suspend
                      </button>
                    )}
                  </Menu.Item>
                  {props.showTerminateOption && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => props.onTerminate?.()}
                          className={classNames(
                            active ? 'dark:bg-dynamicui-gray-250 bg-gray-100' : '',
                            'block w-full px-4 py-2 text-left text-sm text-[color:var(--uic-header-dropdown-menu-terminate-entry-text-color)] dark:text-[#d6868d] ',
                          )}
                        >
                          Terminate
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
    </div>
  );
}

function isReactClassComponent(element: DynamicUiFormFieldComponent): boolean {
  return element?.prototype?.isReactComponent != null;
}

function assertElementIsReactComponent(
  element: DynamicUiFormFieldComponent,
): asserts element is DynamicUiComponentType {
  if (ReactIs.isValidElementType(element) && isReactClassComponent(element)) {
    return;
  }

  throw new Error(`Expected Element to be a React Component`);
}

function assertElementIsRenderFunction(
  element: DynamicUiFormFieldComponent,
): asserts element is DynamicUiForwardedRefRenderFunction {
  if (ReactIs.isValidElementType(element) && !isReactClassComponent(element)) {
    return;
  }

  throw new Error(`Expected Element to be a functional Component`);
}

function transformFormDataToFormState(formData: FormData, formFieldRefs: Map<string, FormFieldRefsMapObj>) {
  const formState: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (value instanceof File) {
      console.warn(
        `[@5minds/processcube_app_sdk:DynamicUi]\t\tOnly plain objects can be passed to Server Components from Client Components. File objects are not supported. Add a getState Function to your component to return a JSON Primitive value as state.\n\nFormField: ${key} with ${value} `,
      );
      return;
    }

    if (!formState[key]) {
      formState[key] = value;
    } else {
      formState[key] = Array.isArray(formState[key]) ? [...formState[key], value] : [formState[key], value];
    }
  });

  formFieldRefs.forEach((obj, formFieldId) => {
    if (typeof obj.ref.current?.getState === 'function') {
      const state = obj.ref.current.getState();
      if (
        typeof state === 'boolean' ||
        typeof state === 'number' ||
        typeof state === 'string' ||
        Array.isArray(state) ||
        state == null ||
        state?.toString() === '[object Object]'
      ) {
        formState[formFieldId] = state;
      }
    }
  });

  return formState;
}

function transformFormDataToUserTaskResult(
  formData: FormData,
  formFields: DataModels.FlowNodeInstances.UserTaskFormField[],
  formFieldRefs: Map<string, FormFieldRefsMapObj>,
): DataModels.FlowNodeInstances.UserTaskResult {
  const userTaskResult: DataModels.FlowNodeInstances.UserTaskResult = {};

  for (const key of formData.keys()) {
    const data = formData.getAll(key);

    if (data[0] instanceof File) {
      console.warn(
        `[@5minds/processcube_app_sdk:DynamicUi]\t\tOnly plain objects can be passed to Server Components from Client Components. File objects are not supported. Use the raw FormData instance to process files instead.\n\nFormField: ${key} with ${data} `,
      );
      continue;
    }

    if (data.length === 1) {
      userTaskResult[key] = data[0];
    } else {
      userTaskResult[key] = data;
    }

    if (userTaskResult[key] == '') {
      delete userTaskResult[key];
    }

    if (userTaskResult[key]) {
      const type = formFields.find((field) => field.id === key)?.type;
      if (type === 'boolean' || type === 'confirm') {
        userTaskResult[key] = Boolean(userTaskResult[key]);

        continue;
      }

      if (type === 'number') {
        userTaskResult[key] = parseFloat(userTaskResult[key]);

        continue;
      }

      if (type === 'long') {
        userTaskResult[key] = parseInt(userTaskResult[key]);

        continue;
      }
    }
  }

  const booleanFields = formFields.filter((field) => field.type === 'boolean');
  if (booleanFields.length) {
    booleanFields.forEach((field) => {
      if (!userTaskResult[field.id]) {
        userTaskResult[field.id] = false;
      }
    });
  }

  formFieldRefs.forEach((obj, formFieldId) => {
    if (typeof obj.ref.current?.getValue === 'function') {
      const value = obj.ref.current.getValue();
      if (
        typeof value === 'boolean' ||
        typeof value === 'number' ||
        typeof value === 'string' ||
        Array.isArray(value) ||
        value == null ||
        value?.toString() === '[object Object]'
      ) {
        userTaskResult[formFieldId] = value;
      }
    }
  });

  return userTaskResult;
}
