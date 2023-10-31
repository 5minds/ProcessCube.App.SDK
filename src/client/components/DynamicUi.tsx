import React, { Fragment, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import type { DataModels } from '@5minds/processcube_engine_sdk';
import DOMPurify from 'isomorphic-dompurify';

// TODO: state wie früher?
// TODO: DynamicUI State hook?
// TODO: Alert vom alten Portal Aufbau anschauen
// TODO: überschriebene Styles anpassen
// TODO: components überschreibbar machen siehe react-select
export function DynamicUi(
  props: PropsWithChildren<{
    task: DataModels.FlowNodeInstances.UserTaskInstance;
    className?: string;
    title?: React.ReactNode;
    customFieldComponent?: React.ComponentType<{ formField: DataModels.FlowNodeInstances.UserTaskFormField }>;
  }>,
) {
  const { userTaskConfig: config } = props.task;
  const { formFields } = config;
  const confirmFormField = formFields.find((field) => field.type === 'confirm');

  console.log('config', config);
  return (
    <div className="min-h-[200px]  block sm:max-w-lg sm:w-full mx-auto h-full shadow-lg shadow-[color:var(--uic-shadow-color)] dark:shadow-studio-gray-300 rounded-lg">
      <form
        className={classNames(
          'flex flex-col rounded-lg max-h-full bg-[color:var(--uic-background-color)] text-[color:var(--uic-text-color)] shadow-lg shadow-[color:var(--uic-shadow-color)]  dark:bg-studio-gray-500 dark:text-studio-gray-50 dark:shadow-studio-gray-300',
          props.className ? props.className : '',
        )}
        data-user-task-id={props.task.flowNodeId}
        data-user-task-instance-id={props.task.flowNodeInstanceId}
      >
        <header className="px-4 pt-4 pb-3 sm:px-6">
          <Headline title={props.title ?? props.task.flowNodeName ?? 'User Task'} />
        </header>
        <section className="px-4 py-3 sm:px-6 overflow-y-auto">
          <div className="flex flex-col space-y-6 dark:[color-scheme:dark]">
            {formFields.map((field) => {
              if (field.type === 'custom' && props.customFieldComponent) {
                console.log('props.customFieldComponent component', props.customFieldComponent);
                console.log('props.customFieldComponent test', (props.customFieldComponent as any).test);
                console.log('props.customFieldComponent.defaultProps', props.customFieldComponent.defaultProps);
                console.log('getValue', (props.customFieldComponent.defaultProps as any).getValue());
                // const Domp = props.customFieldComponent as any;
                // return <props.customFieldComponent ref={(ref) => console.log('ref')} key={field.id} formField={field} />;
                const Forwared = React.forwardRef(TestFunction);
                const ref = useRef();

                console.log('ref from forwared red', ref);
                return (
                  <Fragment>
                    <TestComponent ref={(ref) => console.log(ref?.myFunction())} />
                    <Forwared ref={ref} />
                    {/* <TestFunction a={13} /> */}
                  </Fragment>
                );
              }
              const Element = FORM_FIELDS[field.type];

              console.log(Element, field);
              if (Element) {
                return <Element key={field.id} formField={field} />;
              }

              return <p key={field.id}>No Field</p>;
            })}
          </div>
        </section>
        <footer className="rounded-b-lg bg-[color:var(--uic-footer-background-color)] px-4 py-3 sm:px-6 dark:bg-studio-gray-600">
          <FormButtons confirmFormField={confirmFormField} />
        </footer>
      </form>
    </div>
  );
}

function TestFunction(props: { a?: number }, ref) {
  console.log('ref', ref);
  function myFunction() {
    console.log('myFunctiond from function component', this);
  }
  // oder ohne bind? und domElement übergeben?
  ref.myFunction = myFunction.bind(ref);

  return <button ref={ref}>TestFunction</button>;
}

class TestComponent extends React.Component<{}> {
  myFunction() {
    console.log('myFunction called');
  }

  render() {
    return <button>Test Component</button>;
  }
}

const FORM_FIELDS: {
  [TFromFieldType in DataModels.FlowNodeInstances.UserTaskFormFieldType | string]: (props: {
    formField: DataModels.FlowNodeInstances.UserTaskFormField;
    state?: any;
  }) => React.JSX.Element;
} = {
  boolean: (props) => <BooleanFormField {...props} />,
  date: (props) => <DateFormField {...props} />,
  enum: (props) => <EnumFormField {...props} />,
  // longs are full numbers
  long: (props) => <IntegerFormField {...props} />,
  // numbers can be decimals
  number: (props) => <DecimalFormField {...props} />,
  string: (props) => <StringFormField {...props} />,
  paragraph: (props) => <ParagraphFormField {...props} />,
  header: (props) => <HeaderFormField {...props} />,
  confirm: (props) => <ConfirmFormField {...props} />,
};

function FormButtons(props: { confirmFormField?: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { confirmFormField } = props;

  let buttons: React.ReactNode = (
    <Fragment>
      <button
        type="button"
        className="w-full inline-flex justify-center px-3 py-2 border text-base leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm sm:ml-2 border-transparent text-[color:var(--uic-footer-continue-button-text-color)] bg-[color:var(--uic-footer-continue-button-background-color)] hover:bg-[color:var(--uic-footer-continue-button-background-hover-color)] focus:ring-[color:var(--uic-footer-continue-button-focus-outline-color)] dark:bg-[#33609a] dark:hover:bg-[#3666a5] dark:focus:ring-[#3666a5]"
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
          type="button"
          className="w-full inline-flex justify-center px-3 py-2 border text-base leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm sm:ml-2 border-transparent text-[color:var(--uic-footer-continue-button-text-color)] bg-[color:var(--uic-footer-continue-button-background-color)] hover:bg-[color:var(--uic-footer-continue-button-background-hover-color)] focus:ring-[color:var(--uic-footer-continue-button-focus-outline-color)] dark:bg-[#33609a] dark:hover:bg-[#3666a5] dark:focus:ring-[#3666a5]"
        >
          {parsedConfirmFormFieldConfig?.confirmButtonText ?? 'Confirm'}
        </button>
        <button
          type="button"
          className="w-full inline-flex justify-center px-3 py-2 border text-base leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm sm:ml-2 border-[color:var(--uic-border-color)] bg-[color:var(--uic-footer-decline-button-background-color)] text-[color:var(--uic-footer-decline-button-text-color)] hover:bg-[color:var(--uic-footer-decline-button-background-hover-color)] focus:ring-[color:var(--uic-footer-decline-button-focus-outline-color)] dark:bg-studio-gray-350 dark:border-transparent dark:text-studio-gray-50 dark:hover:bg-studio-gray-300 dark:focus:ring-studio-gray-300"
        >
          {parsedConfirmFormFieldConfig?.declineButtonText ?? 'Decline'}
        </button>
      </Fragment>
    );
  }
  return <div className="space-y-2 sm:-space-x-2 sm:space-y-0 sm:flex sm:flex-row-reverse">{buttons}</div>;
}

function classNames(...classes) {
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
function Headline(props: { title?: React.ReactNode }) {
  return (
    <div className="flex space-x-3">
      <div className="flex-1">
        <h3
          id="headline-title"
          className="text-lg leading-6 font-medium text-[color:var(--uic-header-text-color)] dark:text-studio-gray-150"
        >
          {props.title}
        </h3>
      </div>
      <div className="flex self-center">
        <div id="dropdown" className="relative z-30 inline-block text-left">
          <button
            id="dropdown-toggle-button"
            type="button"
            className="-m-2 p-2 rounded-full flex items-center text-[color:var(--uic-header-dropdown-icon-text-color)] hover:text-[color:var(--uic-header-dropdown-icon-text-hover-color)] focus:outline-none focus:ring-2 focus:ring-[color:var(--uic-focus-color)] dark:text-studio-gray-150 dark:hover:text-studio-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
            </svg>
          </button>
          <div
            className="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[color:var(--uic-header-dropdown-menu-background-color)] ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-studio-gray-400"
            id="dropdown-options"
            role="menu"
            tabIndex={0}
          >
            <div className="py-1" role="none">
              <button
                id="dropdown-option-suspend"
                className="text-[color:var(--uic-header-dropdown-menu-suspend-entry-text-color)] flex w-full px-4 py-2 text-sm hover:bg-[color:var(--uic-header-dropdown-menu-entry-background-hover-color)] focus-visible:outline-none focus-visible:bg-[color:var(--uic-header-dropdown-menu-entry-background-hover-color)] dark:hover:bg-studio-gray-250 dark:focus-visible:bg-studio-gray-250 dark:text-studio-gray-50"
                role="menuitem"
                tabIndex={-1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="mr-3 h-5 w-5 text-[color:var(--uic-header-dropdown-menu-suspend-entry-icon-color)] dark:text-gray-200"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span>Suspend</span>
              </button>
              <button
                id="dropdown-option-terminate"
                className="text-[color:var(--uic-header-dropdown-menu-terminate-entry-text-color)] flex w-full px-4 py-2 text-sm hover:bg-[color:var(--uic-header-dropdown-menu-entry-background-hover-color)] focus-visible:outline-none focus-visible:bg-[color:var(--uic-header-dropdown-menu-entry-background-hover-color)] dark:hover:bg-studio-gray-250 dark:focus-visible:bg-studio-gray-250 dark:text-[#d6868d]"
                role="menuitem"
                tabIndex={-1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="mr-3 h-5 w-5 text-[color:var(--uic-header-dropdown-menu-terminate-entry-icon-color)]"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span>Terminate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BooleanFormField(props: { formField: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { formField } = props;
  const id = `${formField.id}-boolean`;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div className="relative flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          className="focus:ring-[color:var(--uic-focus-color)] h-4 w-4 text-sky-600 border-[color:var(--uic-border-color)] rounded dark:border-2 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400"
          checked={formField.defaultValue === 'true'}
          id={id}
          name={id}
          aria-describedby={parsedCustomFormConfig?.hint ? hintId : undefined}
        />
      </div>
      <div className="ml-3 text-sm">
        <label className="font-medium" htmlFor={id}>
          {formField.label}
        </label>
        {parsedCustomFormConfig?.hint && (
          <p className="text-gray-500 dark:text-studio-gray-200" id={hintId}>
            {parsedCustomFormConfig.hint}
          </p>
        )}
      </div>
    </div>
  );
}

function ConfirmFormField(props: { formField: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { formField } = props;

  return <p className="text-sm">{formField.label}</p>;
}

function DateFormField(props: { formField: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { formField } = props;
  const id = `${formField.id}-date`;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div className="">
      <label className="block text-sm font-medium" htmlFor={id}>
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="shadow-sm focus:ring-[color:var(--uic-focus-color)] focus:border-[color:var(--uic-focus-color)] block w-full sm:text-sm border-[color:var(--uic-border-color)] rounded-md invalid:border-red-500 invalid:ring-red-500 invalid:ring-1 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:invalid:shadow-studio-dark-invalid dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f]"
          type="date"
          value={formField.defaultValue?.toString()}
          id={id}
          name={id}
          aria-describedby={hintId}
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p className="mt-2 text-sm text-gray-500 dark:text-studio-gray-200" id={hintId}>
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}

function DecimalFormField(props: { formField: DataModels.FlowNodeInstances.UserTaskFormField }) {
  const { formField } = props;
  const id = `${formField.id}-decimal`;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={id}>
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="shadow-sm focus:ring-[color:var(--uic-focus-color)] focus:border-[color:var(--uic-focus-color)] block w-full sm:text-sm border-[color:var(--uic-border-color)] rounded-md invalid:border-red-500 invalid:ring-red-500 invalid:ring-1 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:invalid:shadow-studio-dark-invalid dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f]"
          type="number"
          step="0.01"
          placeholder={parsedCustomFormConfig?.placeholder || '0.00'}
          value={formField.defaultValue?.toString()}
          id={id}
          name={id}
          aria-describedby={hintId}
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p className="mt-2 text-sm text-gray-500 dark:text-studio-gray-200" id={hintId}>
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}

interface IHeaderFormFieldProps {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
}

// TODO: styles setzen für header elemente
export const HeaderFormField: React.FC<IHeaderFormFieldProps> = ({ formField }) => {
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
};

interface IntegerFormFieldProps {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: number | null;
}

export const IntegerFormField: React.FC<IntegerFormFieldProps> = ({ formField, state }) => {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div>
      <label htmlFor={`${formField.id}-integer`} className="block text-sm font-medium">
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="shadow-sm focus:ring-[color:var(--uic-focus-color)] focus:border-[color:var(--uic-focus-color)] block w-full sm:text-sm border-[color:var(--uic-border-color)] rounded-md invalid:border-red-500 invalid:ring-red-500 invalid:ring-1 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:invalid:shadow-studio-dark-invalid dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f]"
          type="number"
          step={1}
          id={`${formField.id}-integer`}
          name={`${formField.id}-integer`}
          value={state ? `${state}` : formField.defaultValue?.toString() ?? ''}
          placeholder={parsedCustomFormConfig?.placeholder ?? '0'}
          aria-describedby={`${formField.id}-hint`}
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p id={`${formField.id}-hint`} data-hint className="mt-2 text-sm text-gray-500 dark:text-studio-gray-200">
          {parsedCustomFormConfig.hint}
        </p>
      )}
    </div>
  );
};

interface ParagraphFormFieldProps {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
}

export const ParagraphFormField: React.FC<ParagraphFormFieldProps> = ({ formField: { defaultValue, label } }) => {
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
        '[&_p]:my-4 first-of-type:[&_p]:mt-0 first-of-type:[&_p]:mb-4',
        // links/anchor
        '[&_a]:text-[color:var(--uic-link-color)] hover:[&_a]:text-[color:var(--uic-link-hover-color)] [&_a]:underline',
        // headings
        '[&_h1]:font-bold [&_h1]:text-2xl [&_h2]:font-bold [&_h2]:text-xl [&_h3]:font-bold [&_h3]:text-lg [&_h4]:font-bold [&_h4]:text-base [&_h5]:font-bold [&_h5]:text-sm [&_h6]:font-bold [&_h6]:text-xs',
        // code blocks
        '[&_code]:text-[#e83e8c] [&_pre]:my-4 [&_pre]:bg-gray-100 [&_pre]:dark:bg-studio-gray-700 [&_pre_code]:text-inherit',
        // revert margin
        '[&_h1]:m-[revert] [&_h2]:m-[revert] [&_h3]:m-[revert] [&_h4]:m-[revert] [&_h5]:m-[revert] [&_h6]:m-[revert] [&_blockquote]:m-[revert] [&_ol]:m-[revert] [&_ul]:m-[revert] [&_fieldset]:m-[revert] [&_menu]:m-[revert]',
        // revert padding
        '[&_ol]:p-[revert] [&_ul]:p-[revert] [&_fieldset]:p-[revert] [&_menu]:p-[revert]',
        // list styles
        '[&_ol]:list-decimal [&_ol_p]:my-2 first-of-type:[&_ol_p]:my-4 [&_ul]:list-disc [&_ul_p]:my-2 first-of-type:[&_ul_p]:my-4',
        // checkbox
        "[&_input[type='checkbox']]:h-4 [&_input[type='checkbox']]:w-4 [&_input[type='checkbox']]:rounded [&_input[type='checkbox']]:border-[color:var(--uic-border-color)] [&_input[type='checkbox']]:hover:border-[color:var(--uic-border-color)] [&_input[type='checkbox']]:text-sky-600 [&_input[type='checkbox']]:dark:bg-studio-gray-350 [&_input[type='checkbox']]:dark:border-2 [&_input[type='checkbox']]:dark:border-solid [&_input[type='checkbox']]:dark:border-transparent [&_input[type='checkbox']]:dark:text-[#007bff40] [&_input[type='checkbox']]:dark:hover:checked:bg-studio-gray-350",
      )}
      dangerouslySetInnerHTML={{ __html: generatedHtml }}
    ></div>
  );
};

export interface IStringFormFieldProps {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: string | null;
}

export const StringFormField: React.FC<IStringFormFieldProps> = ({ formField, state }) => {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const inputType = parsedCustomFormConfig?.multiline === 'true' ? 'textarea' : 'input';
  const textInput = React.createElement(inputType, {
    className:
      'shadow-sm focus:ring-[color:var(--uic-focus-color)] focus:border-[color:var(--uic-focus-color)] block w-full sm:text-sm rounded-md border-[color:var(--uic-border-color)] invalid:border-red-500 invalid:ring-red-500 invalid:ring-1 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:invalid:shadow-studio-dark-invalid dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f]',
    id: `${formField.id}-string`,
    name: `${formField.id}-string`,
    value: state || (formField.defaultValue?.toString() ?? ''),
    placeholder: parsedCustomFormConfig?.placeholder,
    'aria-describedby': parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined,
    type: inputType === 'input' ? 'text' : undefined,
    rows: inputType === 'textarea' ? 4 : undefined,
  });

  const hint = parsedCustomFormConfig?.hint ? (
    <p id={`${formField.id}-hint`} className="mt-2 text-sm text-gray-500 dark:text-studio-gray-200">
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={`${formField.id}-string`}>
        {label}
      </label>
      <div className="mt-1">{textInput}</div>
      {hint}
    </div>
  );
};

export interface IEnumFormFieldProps {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: string | Array<string> | null;
}

export const EnumFormField: React.FC<IEnumFormFieldProps> = ({ formField, state }) => {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const options = formField.enumValues;

  let enumInput: JSX.Element;

  switch (parsedCustomFormConfig?.displayAs) {
    case 'checkbox':
      let multipleStateOrDefaultValue;
      if (Array.isArray(state) && state.length) {
        multipleStateOrDefaultValue = state;
      } else {
        multipleStateOrDefaultValue = formField.defaultValue?.toString().split(',') ?? [];
      }

      enumInput = (
        <fieldset
          id={`${formField.id}-enum`}
          className="mt-1 space-y-2"
          data-type="checkbox"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
        >
          {options?.map((option) => {
            const hasValueToBeChecked = multipleStateOrDefaultValue.find((value) => value.trim() === option.id);

            return (
              <div key={option.id} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={hasValueToBeChecked}
                    // TODO: muss hier nicht die option.id als name gesetzt werden?
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="focus:ring-[color:var(--uic-focus-color)] h-4 w-4 text-sky-600 border-[color:var(--uic-border-color)] rounded dark:border-2 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:text-[#007bff40]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={option.id} className="font-medium text-gray-700 dark:text-studio-gray-50">
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
          id={`${formField.id}-enum`}
          className="mt-1 space-y-2"
          data-type="radio"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
        >
          {options?.map((option) => {
            return (
              <div key={option.id} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={(state || formField.defaultValue) == option.id}
                    // TODO: muss hier nicht die option.id als name gesetzt werden?
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="focus:ring-[color:var(--uic-focus-color)] h-4 w-4 text-sky-600 border-[color:var(--uic-border-color)] rounded dark:border-2 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:text-[#007bff40]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={option.id} className="font-medium text-gray-700 dark:text-studio-gray-50">
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
      let noOptionForDefaultValue = true;
      let selected;
      const Select = (props: PropsWithChildren<any>) => (
        <select
          id={`${formField.id}-enum`}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-[color:var(--uic-border-color)] focus:outline-none focus:ring-[color:var(--uic-focus-color)] focus:border-[color:var(--uic-focus-color)] sm:text-sm rounded-md invalid:border-red-500 invalid:ring-red-500 invalid:ring-1 dark:border-solid dark:border-transparent dark:bg-studio-gray-350 dark:focus:shadow-studio-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:invalid:shadow-studio-dark-invalid dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f]"
          onChange={(event) => (event.target.dataset.value = event.target.value)}
          data-value
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
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
              noOptionForDefaultValue = false;
              selected = option.id;
            }

            return (
              <option key={option.id} value={option.id} selected={defaultSelected}>
                {option.name}
              </option>
            );
          })}
        </Fragment>
      );

      enumInput = (
        <Select data-value={selected}>
          <DefaultOption selected={noOptionForDefaultValue ? true : false}>
            {noOptionForDefaultValue && parsedCustomFormConfig?.placeholder}
          </DefaultOption>
          <Options />
        </Select>
      );
      break;
  }

  const hint = parsedCustomFormConfig?.hint ? (
    <p id={`${formField.id}-hint`} className="mt-2 text-sm text-gray-500 dark:text-studio-gray-200">
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={`${formField.id}-enum`}>
        {label}
      </label>
      {enumInput}
      {hint}
    </div>
  );
};

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
