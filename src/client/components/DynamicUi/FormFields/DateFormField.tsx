import React, { useState } from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function DateFormField(
  { formField, state, onValidate }: DynamicUiComponentProps<string | Array<string> | null>,
  ref: DynamicUiFormFieldRef,
) {
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  if (!isValidDate(formField.defaultValue)) {
    console.warn(`[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for date field "${formField.id}"`);
  }

  const defaultValue = state || formField.defaultValue?.toString();

  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  function onFocusLeave(e: any) {
    if (onValidate) {
      onValidate(formField.id, formField.type, e.target.valueAsDate).then((res) => {
        setErrorMessage(res.join('\n'));
        setIsValid(false);
      });
    }
  }

  function resetErrors() {
    setErrorMessage('');
    setIsValid(true);
  }

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="app-sdk-mt-1">
        <input
          className="app-sdk-form-input app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-py-2 app-sdk-px-3 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] app-sdk-shadow-sm invalid:app-sdk-border-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-1 invalid:app-sdk-ring-[color:var(--asdk-dui-formfield-invalid-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:invalid:app-sdk-shadow-app-sdk-dark-invalid dark:focus:app-sdk-shadow-app-sdk-dark"
          type="date"
          defaultValue={defaultValue}
          onBlur={onFocusLeave}
          onChange={resetErrors}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="date"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p
          className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
          id={hintId}
        >
          {parsedCustomFormConfig?.hint}
        </p>
      )}
      {!isValid && <pre className="app-sdk-text-red-600">{errorMessage}</pre>}
    </div>
  );
}

function isValidDate(value: any) {
  return new Date(value?.toString()).toString() !== 'Invalid Date';
}
