import React, {
  FormEventHandler,
  Fragment,
  PropsWithChildren,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { marked } from 'marked';
import { DataModels } from '@5minds/processcube_engine_sdk';
import DOMPurify from 'isomorphic-dompurify';
import * as ReactIs from 'react-is';
import { Menu, Transition } from '@headlessui/react';

// TODO: state wie früher?
// TODO: DynamicUI State hook?
// TODO: Alert vom alten Portal Aufbau anschauen
// TODO: überschriebene Styles anpassen
// TODO: components überschreibbar machen siehe react-select

interface DynamicUiForwardedRefRenderFunction
  extends React.ForwardRefRenderFunction<DynamicUiRefFunctions, DynamicUiComponentProps> {
  (props: DynamicUiComponentProps, ref: DynamicUiFormFieldRef): React.ReactNode;
}
type DynamicUiComponentType = React.ComponentClass<DynamicUiComponentProps>;
type DynamicUiFormFieldComponent =
  | DynamicUiForwardedRefRenderFunction
  | typeof DynamicUiComponent<DynamicUiComponentProps, {}>;

enum MissingFormFieldType {
  paragraph = 'paragraph',
  header = 'header',
  confirm = 'confirm',
}

const UserTaskFormFieldType = {
  ...DataModels.FlowNodeInstances.UserTaskFormFieldType,
  ...MissingFormFieldType,
};

type CommonFormFieldTypeComponentMap = {
  [TFormFieldType in keyof typeof UserTaskFormFieldType]: DynamicUiFormFieldComponent;
};

type GenericFormFieldTypeComponentMap = {
  [type: string]: DynamicUiFormFieldComponent;
};

type DynamicUiFormFieldComponentMap = CommonFormFieldTypeComponentMap | GenericFormFieldTypeComponentMap;
type DynamicUiRefFunctions = Omit<DynamicUiComponent, keyof React.Component>;
type FormFieldRenderer =
  | React.ForwardRefExoticComponent<DynamicUiComponentProps & React.RefAttributes<DynamicUiRefFunctions>>
  | DynamicUiComponentType;
type FormFieldRefsMapObj = {
  renderer: FormFieldRenderer;
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
}
export type DynamicUiFormFieldRef = React.ForwardedRef<DynamicUiRefFunctions>;
export type DynamicUiComponentProps = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: any;
};
export type UserTaskResult = DataModels.FlowNodeInstances.UserTaskResult;

export function DynamicUi(
  props: PropsWithChildren<{
    task: DataModels.FlowNodeInstances.UserTaskInstance;
    onSubmit: (result: UserTaskResult, rawFormData: FormData) => Promise<void>;
    showHeaderMenu?: boolean;
    onSuspend?: (result: UserTaskResult, rawFormData: FormData) => void | Promise<void>;
    showTerminateOption?: boolean;
    onTerminate?: () => void | Promise<void>;
    className?: string;
    classNames?: Partial<Record<'wrapper' | 'base' | 'header' | 'body' | 'footer', string>>;
    title?: React.ReactNode;
    customFieldComponents?: DynamicUiFormFieldComponentMap;
  }>,
) {
  const { userTaskConfig: config } = props.task;
  const { formFields } = config;
  const moreThanOneConfirm = formFields.filter((field) => field.type === 'confirm').length > 1;
  if (moreThanOneConfirm) {
    console.warn(
      `[@5minds/processcube_app_sdk:DynamicUi]\t\tWarning while rendering UserTask "${props.task.flowNodeId}"!\n The UserTask has more than one confirm form field. Please use only one confirm form field per User Task.\n\nThe first confirm form field is used for rendering.`,
    );
  }
  const confirmFormField = formFields.find((field) => field.type === 'confirm');
  const formRef = useRef<HTMLFormElement>(null);

  console.log('config task', props.task);
  const FIELDS = { ...FORM_FIELDS, ...(props.customFieldComponents ? props.customFieldComponents : {}) };
  const formFieldRefs = new Map<string, FormFieldRefsMapObj>();

  console.log('formFieldRefs', formFieldRefs);
  const onSubmit = (formData: FormData) => {
    const userTaskResult = transformFormDataToUserTaskResult(formData, formFields, formFieldRefs);

    // start transition
  };
  const onSuspend = () => {
    console.log('onSuspendCalled');
    const formData = new FormData(formRef.current!);
    const userTaskResult = transformFormDataToUserTaskResult(formData, formFields, formFieldRefs);

    console.log('userTaskResult', userTaskResult, formData);
    props.onSuspend?.(userTaskResult, formData);
  };
  // min-w-fit?
  return (
    <div
      className={classNames(
        'dark:shadow-studio-gray-300 mx-auto block h-full min-h-[200px] rounded-lg shadow-lg shadow-[color:var(--uic-shadow-color)] sm:w-full sm:max-w-lg',
        props.classNames?.wrapper ? props.classNames?.wrapper : '',
        props.className ? props.className : '',
      )}
    >
      <form
        ref={formRef}
        className={classNames(
          'dark:bg-studio-gray-500 dark:text-studio-gray-50 dark:shadow-studio-gray-300 flex max-h-full flex-col rounded-lg bg-[color:var(--uic-background-color)]  text-[color:var(--uic-text-color)] shadow-lg shadow-[color:var(--uic-shadow-color)]',
          props.classNames?.base ? props.classNames?.base : '',
        )}
        data-user-task-id={props.task.flowNodeId}
        data-user-task-instance-id={props.task.flowNodeInstanceId}
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
              const dynamicUiFormFieldComponent = (FIELDS as GenericFormFieldTypeComponentMap)[field.type];

              if (dynamicUiFormFieldComponent) {
                if (!ReactIs.isValidElementType(dynamicUiFormFieldComponent)) {
                  console.warn(
                    `[@5minds/processcube_app_sdk:DynamicUi]\t\tThe given DynamicUiFormFieldComponent is not a valid React Element Type.\n\nFormField:\t${JSON.stringify(
                      field,
                      null,
                      2,
                    )}\nDynamicUiFormFieldComponent:\t${dynamicUiFormFieldComponent.toString()}\n\nRendering 'null' as fallback`,
                  );
                  return null;
                }

                let ReactElement: FormFieldRenderer;

                if (isReactClassComponent(dynamicUiFormFieldComponent)) {
                  assertElementIsReactComponent(dynamicUiFormFieldComponent);

                  ReactElement = dynamicUiFormFieldComponent;
                } else {
                  assertElementIsRenderFunction(dynamicUiFormFieldComponent);

                  ReactElement = forwardRef(dynamicUiFormFieldComponent);
                }

                const ref = useRef<DynamicUiRefFunctions>(null);

                formFieldRefs.set(field.id, { renderer: ReactElement, ref });

                return (
                  <Fragment key={field.id}>
                    <ReactElement ref={ref} formField={field} />
                  </Fragment>
                );
              }

              return null;
            })}
          </div>
        </section>
        <footer
          className={classNames(
            'dark:bg-studio-gray-600 rounded-b-lg bg-[color:var(--uic-footer-background-color)] px-4 py-3 sm:px-6',
            props.classNames?.footer ? props.classNames.footer : '',
          )}
        >
          <FormButtons confirmFormField={confirmFormField} />
        </footer>
      </form>
    </div>
  );
}

function TestFunction(props: any, ref: any) {
  console.log('ref', ref);
  function myFunction() {
    console.log('myFunctiond from function component');
  }
  ref.myFunction = myFunction.bind(ref);

  return <button ref={ref}>TestFunction</button>;
}

class TestComponent extends DynamicUiComponent<DynamicUiComponentProps & { test: 1 }> {
  getValue() {
    console.log('getValue called');
  }

  render() {
    return <button>Test Component</button>;
  }
}

class TestComponentTwo
  extends React.Component<DynamicUiComponentProps, { test: 1 }>
  implements DynamicUiComponent<DynamicUiComponentProps>
{
  getValue() {}
  render() {
    return <button>Test Component</button>;
  }
}

const FORM_FIELDS: DynamicUiFormFieldComponentMap = {
  boolean: BooleanFormField,
  date: DateFormField,
  enum: EnumFormField,
  // longs are full numbers
  long: IntegerFormField,
  // numbers can be decimals
  number: DecimalFormField,
  string: StringFormField,
  paragraph: ParagraphFormField,
  header: HeaderFormField,
  confirm: ConfirmFormField,
  test: TestComponent,
  testzwei: TestComponentTwo,
  bla: TestFunction,
};

function FormButtons(props: { confirmFormField?: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { confirmFormField } = props;

  let buttons: React.ReactNode = (
    <Fragment>
      <button
        type="submit"
        className="inline-flex w-full justify-center rounded-md border border-transparent bg-[color:var(--uic-footer-continue-button-background-color)] px-3 py-2 text-base font-medium leading-4 text-[color:var(--uic-footer-continue-button-text-color)] shadow-sm hover:bg-[color:var(--uic-footer-continue-button-background-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-footer-continue-button-focus-outline-color)] focus:ring-offset-2 sm:ml-2 sm:w-auto sm:text-sm dark:bg-[#33609a] dark:hover:bg-[#3666a5] dark:focus:ring-[#3666a5]"
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
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-[color:var(--uic-footer-continue-button-background-color)] px-3 py-2 text-base font-medium leading-4 text-[color:var(--uic-footer-continue-button-text-color)] shadow-sm hover:bg-[color:var(--uic-footer-continue-button-background-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-footer-continue-button-focus-outline-color)] focus:ring-offset-2 sm:ml-2 sm:w-auto sm:text-sm dark:bg-[#33609a] dark:hover:bg-[#3666a5] dark:focus:ring-[#3666a5]"
          value="true"
        >
          {parsedConfirmFormFieldConfig?.confirmButtonText ?? 'Confirm'}
        </button>
        <button
          type="submit"
          name={confirmFormField.id}
          className="dark:bg-studio-gray-350 dark:text-studio-gray-50 dark:hover:bg-studio-gray-300 dark:focus:ring-studio-gray-300 inline-flex w-full justify-center rounded-md border border-[color:var(--uic-border-color)] bg-[color:var(--uic-footer-decline-button-background-color)] px-3 py-2 text-base font-medium leading-4 text-[color:var(--uic-footer-decline-button-text-color)] shadow-sm hover:bg-[color:var(--uic-footer-decline-button-background-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-footer-decline-button-focus-outline-color)] focus:ring-offset-2 sm:ml-2 sm:w-auto sm:text-sm dark:border-transparent"
          value="false"
        >
          {parsedConfirmFormFieldConfig?.declineButtonText ?? 'Decline'}
        </button>
      </Fragment>
    );
  }
  return <div className="space-y-2 sm:flex sm:flex-row-reverse sm:-space-x-2 sm:space-y-0">{buttons}</div>;
}

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ');
}

function parseCustomFormConfig(customFormConfig?: string): Record<string, string> | null {
  if (customFormConfig != null && customFormConfig.trim() !== '') {
    try {
      const parsedConfig = JSON.parse(customFormConfig);
      return parsedConfig;
    } catch (error) {
      return null;
    }
  }

  return null;
}

// TODO: Tailwind Components nutzen oder NextUI Components
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
          className="dark:text-studio-gray-150 text-lg font-medium leading-6 text-[color:var(--uic-header-text-color)]"
        >
          {props.title}
        </h3>
      </div>
      <div className="flex self-center">
        {showHeaderMenu && (
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="dark:text-studio-gray-150 dark:hover:text-studio-gray-100 flex items-center rounded-full text-[color:var(--uic-header-dropdown-icon-text-color)] hover:text-[color:var(--uic-header-dropdown-icon-text-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-focus-color)]  ">
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
              <Menu.Items className="dark:bg-studio-gray-400 absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-[color:var(--uic-header-dropdown-menu-background-color)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => props.onSuspend?.()}
                        className={classNames(
                          active ? 'dark:bg-studio-gray-250 bg-gray-100' : '',
                          'dark:text-studio-gray-50 block w-full px-4 py-2 text-left text-sm text-gray-700',
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
                            active ? 'dark:bg-studio-gray-250 bg-gray-100' : '',
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

function BooleanFormField(
  props: { formField: DataModels.FlowNodeInstances.UserTaskFormField },
  ref: DynamicUiFormFieldRef,
): JSX.Element {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div className="relative flex items-start">
      <div className="flex h-5 items-center">
        <input
          type="checkbox"
          className="dark:bg-studio-gray-350 dark:focus:shadow-studio-dark h-4 w-4 rounded border-[color:var(--uic-border-color)] text-sky-600 focus:ring-[color:var(--uic-focus-color)] dark:border-2 dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
          defaultChecked={formField.defaultValue === 'true'}
          id={formField.id}
          name={formField.id}
          aria-describedby={parsedCustomFormConfig?.hint ? hintId : undefined}
          data-form-field-type="boolean"
        />
      </div>
      <div className="ml-3 text-sm">
        <label className="font-medium" htmlFor={formField.id}>
          {formField.label}
        </label>
        {parsedCustomFormConfig?.hint && (
          <p className="dark:text-studio-gray-200 text-gray-500" id={hintId}>
            {parsedCustomFormConfig.hint}
          </p>
        )}
      </div>
    </div>
  );
}

function ConfirmFormField(
  props: { formField: DataModels.FlowNodeInstances.UserTaskFormField },
  ref: DynamicUiFormFieldRef,
) {
  const { formField } = props;

  return <p className="text-sm">{formField.label}</p>;
}

function DateFormField(
  props: { formField: DataModels.FlowNodeInstances.UserTaskFormField },
  ref: DynamicUiFormFieldRef,
) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div className="">
      <label className="block text-sm font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:invalid:shadow-studio-dark-invalid block w-full rounded-md border-[color:var(--uic-border-color)] shadow-sm invalid:border-red-500 invalid:ring-1 invalid:ring-red-500 focus:border-[color:var(--uic-focus-color)] focus:ring-[color:var(--uic-focus-color)] sm:text-sm dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f] dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
          type="date"
          value={formField.defaultValue?.toString()}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="date"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p className="dark:text-studio-gray-200 mt-2 text-sm text-gray-500" id={hintId}>
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}

function DecimalFormField(
  props: { formField: DataModels.FlowNodeInstances.UserTaskFormField },
  ref: DynamicUiFormFieldRef,
) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:invalid:shadow-studio-dark-invalid block w-full rounded-md border-[color:var(--uic-border-color)] shadow-sm invalid:border-red-500 invalid:ring-1 invalid:ring-red-500 focus:border-[color:var(--uic-focus-color)] focus:ring-[color:var(--uic-focus-color)] sm:text-sm dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f] dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
          type="number"
          step="0.01"
          placeholder={parsedCustomFormConfig?.placeholder || '0.00'}
          value={formField.defaultValue?.toString()}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="decimal"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p className="dark:text-studio-gray-200 mt-2 text-sm text-gray-500" id={hintId}>
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}

type IHeaderFormFieldProps = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
};

// TODO: styles setzen für header elemente
function HeaderFormField({ formField }: IHeaderFormFieldProps, ref: DynamicUiFormFieldRef) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  let headerElement: JSX.Element;

  switch (parsedCustomFormConfig?.style) {
    case 'heading_1':
      headerElement = (
        <h1 className="text-2xl font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h1>
      );
      break;
    case 'heading_2':
      headerElement = (
        <h2 className="text-xl font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h2>
      );
      break;
    case 'heading_3':
      headerElement = (
        <h3 className="text-lg font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h3>
      );
      break;
    default:
      headerElement = (
        <h1 className="text-2xl font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h1>
      );
      break;
  }

  return <div className="header-form-field">{headerElement}</div>;
}

type IntegerFormFieldProps = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: number | null;
};

function IntegerFormField({ formField, state }: IntegerFormFieldProps, ref: DynamicUiFormFieldRef) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div>
      <label htmlFor={formField.id} className="block text-sm font-medium">
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:invalid:shadow-studio-dark-invalid block w-full rounded-md border-[color:var(--uic-border-color)] shadow-sm invalid:border-red-500 invalid:ring-1 invalid:ring-red-500 focus:border-[color:var(--uic-focus-color)] focus:ring-[color:var(--uic-focus-color)] sm:text-sm dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f] dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
          type="number"
          step={1}
          id={formField.id}
          name={formField.id}
          defaultValue={state ? `${state}` : formField.defaultValue?.toString() ?? ''}
          placeholder={parsedCustomFormConfig?.placeholder ?? '0'}
          aria-describedby={`${formField.id}-hint`}
          data-form-field-type="integer"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p id={`${formField.id}-hint`} data-hint className="dark:text-studio-gray-200 mt-2 text-sm text-gray-500">
          {parsedCustomFormConfig.hint}
        </p>
      )}
    </div>
  );
}

type ParagraphFormFieldProps = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
};

function ParagraphFormField(
  { formField: { defaultValue, label } }: ParagraphFormFieldProps,
  ref: DynamicUiFormFieldRef,
) {
  const [generatedHtml, setGeneratedHtml] = useState('');
  useEffect(() => {
    const html = marked.parse(defaultValue?.toString() ?? label?.toString() ?? '', {
      renderer: new MarkdownRenderer(),
      hooks: {
        postprocess: (html) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] }),
        preprocess: marked.Hooks.prototype.preprocess,
      },
    });

    setGeneratedHtml(html);
  }, [defaultValue, label]);

  return (
    <div
      /** Style the HTML Elements generated by marked */
      className={classNames(
        // base
        'text-sm',
        // paragraph elements
        '[&_p]:my-4 first-of-type:[&_p]:mb-4 first-of-type:[&_p]:mt-0',
        // links/anchor
        '[&_a]:text-[color:var(--uic-link-color)] [&_a]:underline hover:[&_a]:text-[color:var(--uic-link-hover-color)]',
        // headings
        '[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_h4]:text-base [&_h4]:font-bold [&_h5]:text-sm [&_h5]:font-bold [&_h6]:text-xs [&_h6]:font-bold',
        // code blocks
        '[&_pre]:dark:bg-studio-gray-700 [&_code]:text-[#e83e8c] [&_pre]:my-4 [&_pre]:bg-gray-100 [&_pre_code]:text-inherit',
        // revert margin
        '[&_blockquote]:m-[revert] [&_fieldset]:m-[revert] [&_h1]:m-[revert] [&_h2]:m-[revert] [&_h3]:m-[revert] [&_h4]:m-[revert] [&_h5]:m-[revert] [&_h6]:m-[revert] [&_menu]:m-[revert] [&_ol]:m-[revert] [&_ul]:m-[revert]',
        // revert padding
        '[&_fieldset]:p-[revert] [&_menu]:p-[revert] [&_ol]:p-[revert] [&_ul]:p-[revert]',
        // list styles
        '[&_ol]:list-decimal [&_ol_p]:my-2 first-of-type:[&_ol_p]:my-4 [&_ul]:list-disc [&_ul_p]:my-2 first-of-type:[&_ul_p]:my-4',
        // checkbox
        "[&_input[type='checkbox']]:dark:bg-studio-gray-350 [&_input[type='checkbox']]:dark:hover:checked:bg-studio-gray-350 [&_input[type='checkbox']]:h-4 [&_input[type='checkbox']]:w-4 [&_input[type='checkbox']]:rounded [&_input[type='checkbox']]:border-[color:var(--uic-border-color)] [&_input[type='checkbox']]:text-sky-600 [&_input[type='checkbox']]:hover:border-[color:var(--uic-border-color)] [&_input[type='checkbox']]:dark:border-2 [&_input[type='checkbox']]:dark:border-solid [&_input[type='checkbox']]:dark:border-transparent [&_input[type='checkbox']]:dark:text-[#007bff40]",
      )}
      dangerouslySetInnerHTML={{ __html: generatedHtml }}
    ></div>
  );
}

type IStringFormFieldProps = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: string | null;
};

function StringFormField({ formField, state }: IStringFormFieldProps, ref: DynamicUiFormFieldRef) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const inputType = parsedCustomFormConfig?.multiline === 'true' ? 'textarea' : 'input';
  const textInput = React.createElement(inputType, {
    className:
      'shadow-sm focus:ring-[color:var(--uic-focus-color)] focus:border-[color:var(--uic-focus-color)] block w-full sm:text-sm rounded-md border-[color:var(--uic-border-color)] invalid:border-red-500 invalid:ring-red-500 invalid:ring-1 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:invalid:shadow-studio-dark-invalid dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f]',
    id: formField.id,
    name: formField.id,
    defaultValue: state || (formField.defaultValue?.toString() ?? ''),
    placeholder: parsedCustomFormConfig?.placeholder,
    'aria-describedby': parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined,
    type: inputType === 'input' ? 'text' : undefined,
    rows: inputType === 'textarea' ? 4 : undefined,
    'data-form-field-type': 'string',
  });

  const hint = parsedCustomFormConfig?.hint ? (
    <p id={`${formField.id}-hint`} className="dark:text-studio-gray-200 mt-2 text-sm text-gray-500">
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={formField.id}>
        {label}
      </label>
      <div className="mt-1">{textInput}</div>
      {hint}
    </div>
  );
}

type IEnumFormFieldProps = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: string | Array<string> | null;
};

function EnumFormField({ formField, state }: IEnumFormFieldProps, ref: DynamicUiFormFieldRef) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const options = formField.enumValues;

  let enumInput: JSX.Element;

  switch (parsedCustomFormConfig?.displayAs) {
    case 'checkbox':
      let multipleStateOrDefaultValue: any[];
      if (Array.isArray(state) && state.length) {
        multipleStateOrDefaultValue = state;
      } else {
        multipleStateOrDefaultValue = formField.defaultValue?.toString().split(',') ?? [];
      }

      enumInput = (
        <fieldset
          id={formField.id}
          className="mt-1 space-y-2"
          data-type="checkbox"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
        >
          {options?.map((option) => {
            const hasValueToBeChecked = multipleStateOrDefaultValue.find((value) => value.trim() === option.id);

            return (
              <div key={option.id} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    checked={hasValueToBeChecked}
                    // TODO: muss hier nicht die option.id als name gesetzt werden?
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="dark:bg-studio-gray-350 dark:focus:shadow-studio-dark h-4 w-4 rounded border-[color:var(--uic-border-color)] text-sky-600 focus:ring-[color:var(--uic-focus-color)] dark:border-2 dark:border-solid dark:border-transparent dark:text-[#007bff40] dark:placeholder-gray-400 dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={option.id} className="dark:text-studio-gray-50 font-medium text-gray-700">
                    {option.name}
                  </label>
                </div>
              </div>
            );
          })}
        </fieldset>
      );
      break;
    case 'radio':
      enumInput = (
        <fieldset
          id={formField.id}
          className="mt-1 space-y-2"
          data-type="radio"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
        >
          {options?.map((option) => {
            return (
              <div key={option.id} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="radio"
                    checked={(state || formField.defaultValue) == option.id}
                    // TODO: muss hier nicht die option.id als name gesetzt werden?
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="dark:bg-studio-gray-350 dark:focus:shadow-studio-dark h-4 w-4 rounded border-[color:var(--uic-border-color)] text-sky-600 focus:ring-[color:var(--uic-focus-color)] dark:border-2 dark:border-solid dark:border-transparent dark:text-[#007bff40] dark:placeholder-gray-400 dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={option.id} className="dark:text-studio-gray-50 font-medium text-gray-700">
                    {option.name}
                  </label>
                </div>
              </div>
            );
          })}
        </fieldset>
      );
      break;
    default:
      const [defaultSelected, setDefaultSelected] = useState<string>('');
      const Select = (props: PropsWithChildren<any>) => (
        <select
          id={formField.id}
          name={formField.id}
          className="dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:invalid:shadow-studio-dark-invalid mt-1 block w-full rounded-md border-[color:var(--uic-border-color)] py-2 pl-3 pr-10 text-base invalid:border-red-500 invalid:ring-1 invalid:ring-red-500 focus:border-[color:var(--uic-focus-color)] focus:outline-none focus:ring-[color:var(--uic-focus-color)] sm:text-sm dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f] dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
          onChange={(event) => {
            event.target.dataset.value = event.target.value;
            setDefaultSelected(event.target.value);
          }}
          data-value
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
          {...props}
        >
          {props.children}
        </select>
      );

      const DefaultOption = (props: PropsWithChildren<any>) => {
        const { children, ...rest } = props;
        return (
          <option disabled hidden style={{ display: 'none' }} value="" {...rest}>
            {children}
          </option>
        );
      };

      const Options = () => (
        <Fragment>
          {options?.map((option) => {
            const defaultSelected = (state || formField.defaultValue) === option.id;
            if (defaultSelected) {
              setDefaultSelected(option.id);
            }

            return (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            );
          })}
        </Fragment>
      );

      enumInput = (
        <Select data-value={defaultSelected} value={defaultSelected}>
          <DefaultOption>{!defaultSelected && parsedCustomFormConfig?.placeholder}</DefaultOption>
          <Options />
        </Select>
      );
      break;
  }

  const hint = parsedCustomFormConfig?.hint ? (
    <p id={`${formField.id}-hint`} className="dark:text-studio-gray-200 mt-2 text-sm text-gray-500">
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={formField.id}>
        {label}
      </label>
      {enumInput}
      {hint}
    </div>
  );
}

class MarkdownRenderer extends marked.Renderer {
  link(href: string, title: string | null | undefined, text: string): string {
    const link = super.link(href, title, text);

    return link.replace('<a', "<a target='_blank'");
  }

  html(html: string, block?: boolean | undefined): string {
    const result = super.html(html, block);

    if (result.startsWith('<a ') && !result.includes('target=')) {
      return result.replace('<a ', `<a target="_blank" `);
    }

    return result;
  }
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

function transformFormDataToUserTaskResult(
  formData: FormData,
  formFields: DataModels.FlowNodeInstances.UserTaskFormField[],
  formFieldRefs: Map<string, FormFieldRefsMapObj>,
): DataModels.FlowNodeInstances.UserTaskResult {
  const userTaskResult: DataModels.FlowNodeInstances.UserTaskResult = {};

  for (const key of formData.keys()) {
    const data = formData.getAll(key);

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
