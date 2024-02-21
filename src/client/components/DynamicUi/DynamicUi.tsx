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

  const rootClassNames: string = classNames(
    'dynamic-ui-mx-auto dynamic-ui-block dynamic-ui-h-full dynamic-ui-min-h-[200px] dynamic-ui-rounded-lg dynamic-ui-shadow-lg dynamic-ui-shadow-[color:var(--dui-shadow-color)] sm:dynamic-ui-w-full sm:dynamic-ui-max-w-lg',
    props.classNames?.wrapper ? props.classNames?.wrapper : '',
    props.className ? props.className : '',
  );
  const withDarkMode = rootClassNames.split(' ').includes('dark');

  return (
    <div
      className={withDarkMode ? `dark dynamic-ui-dark ${rootClassNames}` : rootClassNames}
      data-dynamic-ui
    >
      <form
        ref={formRef}
        className={classNames(
          'dynamic-ui-flex dynamic-ui-max-h-full dynamic-ui-flex-col dynamic-ui-rounded-lg dynamic-ui-bg-[color:var(--dui-background-color)]  dynamic-ui-text-[color:var(--dui-text-color)] dynamic-ui-shadow-lg dynamic-ui-shadow-[color:var(--dui-shadow-color)]',
          props.classNames?.base ? props.classNames?.base : '',
        )}
        data-user-task-id={props.task.flowNodeId}
        data-user-task-instance-id={props.task.flowNodeInstanceId}
        onChange={onFormDataChange}
        action={onSubmit}
      >
        <header
          className={classNames('dynamic-ui-px-4 dynamic-ui-pb-3 dynamic-ui-pt-4 sm:dynamic-ui-px-6', props.classNames?.header ? props.classNames.header : '')}
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
            'dynamic-ui-overflow-y-auto dynamic-ui-px-4 dynamic-ui-py-3 sm:dynamic-ui-px-6',
            props.classNames?.body ? props.classNames.body : '',
          )}
        >
          <div className="dynamic-ui-flex dynamic-ui-flex-col dynamic-ui-space-y-6 dark:[color-scheme:dark]">
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
              return null;
            })}
          </div>
        </section>
        <footer
          className={classNames(
            'dynamic-ui-rounded-b-lg dynamic-ui-bg-[color:var(--dui-footer-background-color)] dynamic-ui-px-4 dynamic-ui-py-3 sm:dynamic-ui-px-6',
            props.classNames?.footer ? props.classNames.footer : '',
          )}
        >
          <FormButtons confirmFormField={confirmFormField} />
        </footer>
      </form>
    </div>
  );
}

function FormButtons(props: { confirmFormField?: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { confirmFormField } = props;

  let buttons: React.ReactNode = (
    <Fragment>
      <button
        type="submit"
        className="dynamic-ui-inline-flex dynamic-ui-w-full dynamic-ui-justify-center dynamic-ui-rounded-md dynamic-ui-border dynamic-ui-border-transparent dynamic-ui-bg-[color:var(--dui-footer-continue-button-background-color)] dynamic-ui-px-3 dynamic-ui-py-2 dynamic-ui-text-base dynamic-ui-font-medium dynamic-ui-leading-4 dynamic-ui-text-[color:var(--dui-footer-continue-button-text-color)] dynamic-ui-shadow-sm hover:dynamic-ui-bg-[color:var(--dui-footer-continue-button-background-hover-color)] focus:dynamic-ui-outline-none focus:dynamic-ui-ring-2 focus:dynamic-ui-ring-[color:var(--dui-footer-continue-button-focus-outline-color)] focus:dynamic-ui-ring-offset-2 sm:dynamic-ui-ml-2 sm:dynamic-ui-w-auto sm:dynamic-ui-text-sm "
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
          className="dynamic-ui-inline-flex dynamic-ui-w-full dynamic-ui-justify-center dynamic-ui-rounded-md dynamic-ui-border dynamic-ui-border-transparent dynamic-ui-bg-[color:var(--dui-footer-continue-button-background-color)] dynamic-ui-px-3 dynamic-ui-py-2 dynamic-ui-text-base dynamic-ui-font-medium dynamic-ui-leading-4 dynamic-ui-text-[color:var(--dui-footer-continue-button-text-color)] dynamic-ui-shadow-sm hover:dynamic-ui-bg-[color:var(--dui-footer-continue-button-background-hover-color)] focus:dynamic-ui-outline-none focus:dynamic-ui-ring-2 focus:dynamic-ui-ring-[color:var(--dui-footer-continue-button-focus-outline-color)] focus:dynamic-ui-ring-offset-2 sm:dynamic-ui-ml-2 sm:dynamic-ui-w-auto sm:dynamic-ui-text-sm "
          value="true"
        >
          {parsedConfirmFormFieldConfig?.confirmButtonText ?? 'Confirm'}
        </button>
        <button
          type="submit"
          name={confirmFormField.id}
          className="dynamic-ui-inline-flex dynamic-ui-w-full dynamic-ui-justify-center dynamic-ui-rounded-md dynamic-ui-border dynamic-ui-border-[color:var(--dui-border-color)] dynamic-ui-bg-[color:var(--dui-footer-decline-button-background-color)] dynamic-ui-px-3 dynamic-ui-py-2 dynamic-ui-text-base dynamic-ui-font-medium dynamic-ui-leading-4 dynamic-ui-text-[color:var(--dui-footer-decline-button-text-color)] dynamic-ui-shadow-sm hover:dynamic-ui-bg-[color:var(--dui-footer-decline-button-background-hover-color)] focus:dynamic-ui-outline-none focus:dynamic-ui-ring-2 focus:dynamic-ui-ring-[color:var(--dui-footer-decline-button-focus-outline-color)] focus:dynamic-ui-ring-offset-2 sm:dynamic-ui-ml-2 sm:dynamic-ui-w-auto sm:dynamic-ui-text-sm"
          value="false"
        >
          {parsedConfirmFormFieldConfig?.declineButtonText ?? 'Decline'}
        </button>
      </Fragment>
    );
  }
  return <div className="dynamic-ui-space-y-2 sm:dynamic-ui-flex sm:dynamic-ui-flex-row-reverse sm:-dynamic-ui-space-x-2 sm:dynamic-ui-space-y-0">{buttons}</div>;
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
    <div className="dynamic-ui-flex dynamic-ui-space-x-3">
      <div className="dynamic-ui-flex-1">
        <h3
          id="headline-title"
          className="dynamic-ui-text-lg dynamic-ui-font-medium dynamic-ui-leading-6 dynamic-ui-text-[color:var(--dui-header-text-color)]"
        >
          {props.title}
        </h3>
      </div>
      <div className="dynamic-ui-flex dynamic-ui-self-center">
        {showHeaderMenu && (
          <Menu as="div" className="dynamic-ui-relative dynamic-ui-inline-block dynamic-ui-text-left">
            <div>
              <Menu.Button className="dynamic-ui-flex dynamic-ui-items-center dynamic-ui-rounded-full dynamic-ui-text-[color:var(--dui-header-dropdown-icon-text-color)] hover:dynamic-ui-text-[color:var(--dui-header-dropdown-icon-text-hover-color)] focus:dynamic-ui-outline-none focus:dynamic-ui-ring-2 focus:dynamic-ui-ring-[color:var(--dui-focus-color)]  ">
                <span className="dynamic-ui-sr-only">Open options</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="dynamic-ui-h-5 dynamic-ui-w-5"
                >
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="dynamic-ui-transition dynamic-ui-ease-out dynamic-ui-duration-100"
              enterFrom="dynamic-ui-transform dynamic-ui-opacity-0 dynamic-ui-scale-95"
              enterTo="dynamic-ui-transform dynamic-ui-opacity-100 dynamic-ui-scale-100"
              leave="dynamic-ui-transition dynamic-ui-ease-in dynamic-ui-duration-75"
              leaveFrom="dynamic-ui-transform dynamic-ui-opacity-100 dynamic-ui-scale-100"
              leaveTo="dynamic-ui-transform dynamic-ui-opacity-0 dynamic-ui-scale-95"
            >
              <Menu.Items className="dynamic-ui-absolute dynamic-ui-right-0 dynamic-ui-z-10 dynamic-ui-mt-2 dynamic-ui-w-56 dynamic-ui-origin-top-right dynamic-ui-rounded-md dynamic-ui-bg-[color:var(--dui-header-dropdown-menu-background-color)] dynamic-ui-shadow-lg dynamic-ui-ring-1 dynamic-ui-ring-black dynamic-ui-ring-opacity-5 focus:dynamic-ui-outline-none">
                <div className="dynamic-ui-py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => props.onSuspend?.()}
                        className={classNames(
                          active ? 'dynamic-ui-bg-[color:var(--dui-header-dropdown-menu-entry-background-hover-color)]' : '',
                          'dynamic-ui-block dynamic-ui-w-full dynamic-ui-px-4 dynamic-ui-py-2 dynamic-ui-text-left dynamic-ui-text-sm dynamic-ui-text-[color:var(--dui-header-dropdown-menu-suspend-entry-text-color)]',
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
                            active ? 'dynamic-ui-bg-[color:var(--dui-header-dropdown-menu-entry-background-hover-color)]' : '',
                            'dynamic-ui-block dynamic-ui-w-full dynamic-ui-px-4 dynamic-ui-py-2 dynamic-ui-text-left dynamic-ui-text-sm dynamic-ui-text-[color:var(--dui-header-dropdown-menu-terminate-entry-text-color)]',
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
