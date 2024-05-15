import React, { Fragment, PropsWithChildren, forwardRef, useRef } from 'react';
import * as ReactIs from 'react-is';
import semverGt from 'semver/functions/gt';
import semverPrerelease from 'semver/functions/prerelease';
import semverSatisfies from 'semver/functions/satisfies';

import { DataModels } from '@5minds/processcube_engine_sdk';

import { UserTaskInstance, mapUserTask } from '../../../common/types';
import { classNames } from '../../utils/classNames';
import {
  type DynamicUiFormFieldComponentMap,
  FormFieldComponentMap,
  type GenericFormFieldTypeComponentMap,
} from './FormFields';
import { parseCustomFormConfig } from './utils/parseCustomFormConfig';

const REACT_VERSION_IS_SUPPORTED = semverSatisfies(React.version, '>=18.0.0 <19', { includePrerelease: true });
const REACT_IS_STABLE = semverPrerelease(React.version) == null;
const REACT_IS_CANARY_AND_GREATER_THAN_STABLE =
  !REACT_IS_STABLE && semverGt(React.version, '18.2.0') && React.version.includes('canary');

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
    /** UserTaskInstance with a defined dynamic form  */
    task: DataModels.FlowNodeInstances.UserTaskInstance | UserTaskInstance;
    /** Custom element to insert into the DynamicUI Headline */
    headerComponent?: JSX.Element;
    /** Callback, that will be called when the form is submitted */
    onSubmit: (result: UserTaskResult, rawFormData: FormData, task: UserTaskInstance) => Promise<void>;
    /** Callback, that will be called based on the validation strategy */
    onValidate: (formData: FormData) => Promise<Error>;
    /** Decides which strategy is used to validate the FormData. Default is onSubmit */
    validationStrategy?: 'onsubmit' | 'onfocusleave' | 'onchange';
    /** Custom class name for the root element */
    className?: string;
    /** Custom class names for the different parts of the component */
    classNames?: Partial<Record<'wrapper' | 'base' | 'header' | 'body' | 'footer', string>>;
    /** Custom title for the headline of the dialog */
    title?: React.ReactNode;
    /** Custom components that will be used to render own form field types or override existing ones */
    customFieldComponents?: DynamicUiFormFieldComponentMap;
    /** Initial state of the form fields */
    state?: FormState;
    /** Callback, that is called on every form field change */
    onStateChange?: (newValue: string, formFieldId: string, formState: FormState) => void | Promise<void>;
    /** Option to enable dark mode */
    darkMode?: true;
  }>,
) {
  if (!REACT_VERSION_IS_SUPPORTED) {
    console.warn(
      `[@5minds/processcube_app_sdk:DynamicUi]\t\tThe React version is not supported!\nVersion: ${React.version}`,
    );
  }

  const { userTaskConfig: config } = props.task;
  const { formFields } = config;
  const timeoutRef = useRef<number>();
  const formRef = useRef<HTMLFormElement>(null);
  const formFieldRefs = new Map<string, FormFieldRefsMapObj>(
    formFields.map((field) => [field.id, { ref: React.createRef<DynamicUiRefFunctions>() }]),
  );

  const confirmFormFields = formFields.filter((field) => field.type === 'confirm');
  if (confirmFormFields.length > 1) {
    console.warn(
      `[@5minds/processcube_app_sdk:DynamicUi]\t\tWarning while rendering UserTask "${props.task.flowNodeId}"!\n The UserTask has more than one confirm form field. Please use only one confirm form field per User Task.\n\nThe first confirm form field is used for rendering.`,
    );
  }

  const confirmFormField = confirmFormFields.length === 1 ? confirmFormFields[0] : null;

  const formFieldComponentMap = {
    ...FormFieldComponentMap,
    ...(props.customFieldComponents ? props.customFieldComponents : {}),
  };

  const onSubmit = (formData: FormData) => {
    if (props.validationStrategy === 'onsubmit' || props.validationStrategy == undefined) {
      const res = props.onValidate(formData);
    }
    const userTaskResult = transformFormDataToUserTaskResult(formData, formFields, formFieldRefs);
    props.onSubmit(userTaskResult, formData, mapUserTask(props.task));
  };

  async function onFormDataChange(event: React.FormEvent<HTMLFormElement>) {
    if (props.validationStrategy === 'onchange') {
      const res = await props.onValidate(new FormData(formRef.current!));
    }

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
    'app-sdk-default-styles app-sdk-mx-auto app-sdk-block app-sdk-h-full app-sdk-min-h-[200px] app-sdk-rounded-lg app-sdk-shadow-lg app-sdk-shadow-[color:var(--asdk-dui-shadow-color)] sm:app-sdk-w-full sm:app-sdk-max-w-lg',
    props.classNames?.wrapper ?? '',
    props.className ?? '',
  );
  const withDarkMode = props.darkMode || rootClassNames.split(' ').includes('dark');

  const submitAndActionAttributes = {
    // React supports functions as a form "action" in the current canary (used by Nextjs) release (next stable).
    // In order for the Dynamic UI to work with the current stable version of React, we need to use a workaround here.
    ...(REACT_IS_CANARY_AND_GREATER_THAN_STABLE && {
      action: onSubmit,
    }),
    ...(!REACT_IS_CANARY_AND_GREATER_THAN_STABLE &&
      REACT_IS_STABLE && {
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
          // provide submitter information for confirm fields
          const formData = new FormData(formRef.current!);
          const submitter = (e.nativeEvent as any).submitter as HTMLButtonElement;
          if (!formData.has(submitter.name)) {
            formData.append(submitter.name, submitter.value);
          }
          onSubmit(formData);
        },
        method: 'dialog',
      }),
  };
  return (
    <div
      className={
        withDarkMode
          ? `dark app-sdk-dark ${rootClassNames}`
          : classNames(...rootClassNames.split(' ').filter((c) => c !== 'dark' && c !== 'app-sdk-dark'))
      }
      data-dynamic-ui
      data-blablabl
    >
      <form
        ref={formRef}
        className={classNames(
          'app-sdk-flex app-sdk-max-h-full app-sdk-flex-col app-sdk-rounded-lg app-sdk-bg-[color:var(--asdk-dui-background-color)]  app-sdk-text-[color:var(--asdk-dui-text-color)] app-sdk-shadow-lg app-sdk-shadow-[color:var(--asdk-dui-shadow-color)]',
          props.classNames?.base ?? '',
        )}
        data-user-task-id={props.task.flowNodeId}
        data-user-task-instance-id={props.task.flowNodeInstanceId}
        onChange={onFormDataChange}
        {...submitAndActionAttributes}
      >
        <header
          className={classNames(
            'app-sdk-px-4 app-sdk-pb-3 app-sdk-pt-4 sm:app-sdk-px-6',
            props.classNames?.header ? props.classNames.header : '',
          )}
        >
          <Headline
            title={props.title ?? props.task.flowNodeName ?? 'User Task'}
            headerComponent={props.headerComponent}
          />
        </header>
        <section
          className={classNames(
            'app-sdk-overflow-y-auto app-sdk-px-4 app-sdk-py-3 sm:app-sdk-px-6',
            props.classNames?.body ?? '',
          )}
        >
          <div className="app-sdk-flex app-sdk-flex-col app-sdk-space-y-6 dark:[color-scheme:dark]">
            {formFields.map((field) => {
              const DynamicUiFormFieldComponent = (formFieldComponentMap as GenericFormFieldTypeComponentMap)[
                field.type
              ];

              if (!DynamicUiFormFieldComponent) {
                return null;
              }

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
            })}
          </div>
        </section>
        <footer
          className={classNames(
            'app-sdk-rounded-b-lg app-sdk-bg-[color:var(--asdk-dui-footer-background-color)] app-sdk-px-4 app-sdk-py-3 sm:app-sdk-px-6',
            props.classNames?.footer ?? '',
          )}
        >
          <FormButtons confirmFormField={confirmFormField} />
        </footer>
      </form>
    </div>
  );
}

function FormButtons(props: { confirmFormField: DataModels.FlowNodeInstances.UserTaskFormField | null }) {
  const { confirmFormField } = props;

  let buttons: React.ReactNode = (
    <Fragment>
      <button
        type="submit"
        className="app-sdk-cursor-pointer disabled:app-sdk-cursor-default app-sdk-inline-flex app-sdk-w-full app-sdk-justify-center app-sdk-rounded-md app-sdk-border app-sdk-border-transparent app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-color)] app-sdk-px-3 app-sdk-py-2 app-sdk-text-base app-sdk-font-medium app-sdk-leading-4 app-sdk-text-[color:var(--asdk-dui-footer-continue-button-text-color)] app-sdk-shadow-sm hover:app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-hover-color)] focus:app-sdk-outline-none focus:app-sdk-ring-2 focus:app-sdk-ring-[color:var(--asdk-dui-footer-continue-button-focus-outline-color)] focus:app-sdk-ring-offset-2 sm:app-sdk-ml-2 sm:app-sdk-w-auto sm:app-sdk-text-sm "
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
          className="app-sdk-cursor-pointer disabled:app-sdk-cursor-default app-sdk-inline-flex app-sdk-w-full app-sdk-justify-center app-sdk-rounded-md app-sdk-border app-sdk-border-transparent app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-color)] app-sdk-px-3 app-sdk-py-2 app-sdk-text-base app-sdk-font-medium app-sdk-leading-4 app-sdk-text-[color:var(--asdk-dui-footer-continue-button-text-color)] app-sdk-shadow-sm hover:app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-hover-color)] focus:app-sdk-outline-none focus:app-sdk-ring-2 focus:app-sdk-ring-[color:var(--asdk-dui-footer-continue-button-focus-outline-color)] focus:app-sdk-ring-offset-2 sm:app-sdk-ml-2 sm:app-sdk-w-auto sm:app-sdk-text-sm "
          value="true"
        >
          {parsedConfirmFormFieldConfig?.confirmButtonText ?? 'Confirm'}
        </button>
        <button
          type="submit"
          name={confirmFormField.id}
          className="app-sdk-cursor-pointer disabled:app-sdk-cursor-default app-sdk-inline-flex app-sdk-w-full app-sdk-justify-center app-sdk-rounded-md app-sdk-border app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-footer-decline-button-background-color)] app-sdk-px-3 app-sdk-py-2 app-sdk-text-base app-sdk-font-medium app-sdk-leading-4 app-sdk-text-[color:var(--asdk-dui-footer-decline-button-text-color)] app-sdk-shadow-sm hover:app-sdk-bg-[color:var(--asdk-dui-footer-decline-button-background-hover-color)] focus:app-sdk-outline-none focus:app-sdk-ring-2 focus:app-sdk-ring-[color:var(--asdk-dui-footer-decline-button-focus-outline-color)] focus:app-sdk-ring-offset-2 sm:app-sdk-ml-2 sm:app-sdk-w-auto sm:app-sdk-text-sm"
          value="false"
        >
          {parsedConfirmFormFieldConfig?.declineButtonText ?? 'Decline'}
        </button>
      </Fragment>
    );
  }
  return (
    <div className="app-sdk-space-y-2 sm:app-sdk-flex sm:app-sdk-flex-row-reverse sm:-app-sdk-space-x-2 sm:app-sdk-space-y-0">
      {buttons}
    </div>
  );
}

function Headline(props: { title?: React.ReactNode; headerComponent?: JSX.Element }) {
  return (
    <div className="app-sdk-flex app-sdk-space-x-3">
      <div className="app-sdk-flex-1">
        <h3
          id="headline-title"
          className="app-sdk-text-lg app-sdk-font-medium app-sdk-leading-6 app-sdk-text-[color:var(--asdk-dui-header-text-color)]"
        >
          {props.title}
        </h3>
      </div>
      <div className="app-sdk-flex app-sdk-self-center">{props.headerComponent}</div>
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
      if (type === 'boolean') {
        userTaskResult[key] = userTaskResult[key] === 'on';

        continue;
      }

      if (type === 'confirm') {
        userTaskResult[key] = JSON.parse(userTaskResult[key]);

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
