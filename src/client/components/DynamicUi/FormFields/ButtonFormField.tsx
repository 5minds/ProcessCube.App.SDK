import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function ButtonFormField(props: DynamicUiComponentProps<string | null>, ref: DynamicUiFormFieldRef) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const defaultValue = formField.defaultValue?.toString() || 'Button';

  let buttonInput: JSX.Element;

  switch (parsedCustomFormConfig?.displayAs) {
    case 'submit':
      buttonInput = (
        <input
          className="app-sdk-cursor-pointer disabled:app-sdk-cursor-default app-sdk-inline-flex app-sdk-w-full app-sdk-justify-center app-sdk-rounded-md app-sdk-border app-sdk-border-transparent app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-color)] app-sdk-px-3 app-sdk-py-2 app-sdk-text-base app-sdk-font-medium app-sdk-leading-4 app-sdk-text-[color:var(--asdk-dui-footer-continue-button-text-color)] app-sdk-shadow-sm hover:app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-hover-color)] focus:app-sdk-outline-none focus:app-sdk-ring-2 focus:app-sdk-ring-[color:var(--asdk-dui-footer-continue-button-focus-outline-color)] focus:app-sdk-ring-offset-2 sm:app-sdk-ml-2 sm:app-sdk-w-auto sm:app-sdk-text-sm "
          type="submit"
          value={defaultValue}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="submit"
        />
      );
      break;
    case 'reset':
      buttonInput = (
        <input
          className="app-sdk-cursor-pointer disabled:app-sdk-cursor-default app-sdk-inline-flex app-sdk-w-full app-sdk-justify-center app-sdk-rounded-md app-sdk-border app-sdk-border-transparent app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-color)] app-sdk-px-3 app-sdk-py-2 app-sdk-text-base app-sdk-font-medium app-sdk-leading-4 app-sdk-text-[color:var(--asdk-dui-footer-continue-button-text-color)] app-sdk-shadow-sm hover:app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-hover-color)] focus:app-sdk-outline-none focus:app-sdk-ring-2 focus:app-sdk-ring-[color:var(--asdk-dui-footer-continue-button-focus-outline-color)] focus:app-sdk-ring-offset-2 sm:app-sdk-ml-2 sm:app-sdk-w-auto sm:app-sdk-text-sm "
          type="reset"
          value={defaultValue}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="reset"
        />
      );
      break;
    default:
      buttonInput = (
        <input
          className="app-sdk-cursor-pointer disabled:app-sdk-cursor-default app-sdk-inline-flex app-sdk-w-full app-sdk-justify-center app-sdk-rounded-md app-sdk-border app-sdk-border-transparent app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-color)] app-sdk-px-3 app-sdk-py-2 app-sdk-text-base app-sdk-font-medium app-sdk-leading-4 app-sdk-text-[color:var(--asdk-dui-footer-continue-button-text-color)] app-sdk-shadow-sm hover:app-sdk-bg-[color:var(--asdk-dui-footer-continue-button-background-hover-color)] focus:app-sdk-outline-none focus:app-sdk-ring-2 focus:app-sdk-ring-[color:var(--asdk-dui-footer-continue-button-focus-outline-color)] focus:app-sdk-ring-offset-2 sm:app-sdk-ml-2 sm:app-sdk-w-auto sm:app-sdk-text-sm "
          type="button"
          value={defaultValue}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="button"
        />
      );
      break;
  }

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="app-sdk-mt-1">{buttonInput}</div>
      {parsedCustomFormConfig?.hint && (
        <p
          className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
          id={hintId}
        >
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}
