import React, { useState } from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function BooleanFormField(
  { formField, state, onValidate }: DynamicUiComponentProps<string | Array<string> | null>,
  ref: DynamicUiFormFieldRef,
): JSX.Element {
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  function onFocusLeave(e: any) {
    console.log(e);
    if (onValidate) {
      onValidate(formField.id, 'boolean', e.target.checked).then((res) => {
        if (res != undefined) {
          setErrorMessage(res);
          setIsValid(false);
        } else {
          setErrorMessage('');
          setIsValid(true);
        }
      });
    }
  }

  function resetErrors() {
    setErrorMessage('');
    setIsValid(true);
  }

  return (
    <div className="app-sdk-relative app-sdk-flex app-sdk-items-start">
      <div className="app-sdk-flex app-sdk-h-5 app-sdk-items-center">
        <input
          type="checkbox"
          className={`${!isValid ? 'app-sdk-bg-red-600/20' : 'app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)]'} app-sdk-form-checkbox app-sdk-border app-sdk-h-4 app-sdk-w-4 app-sdk-rounded app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-text-[color:var(--asdk-dui-formfield-checkbox-text-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] dark:app-sdk-border-2 dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark`}
          defaultChecked={(state && state !== 'false') || formField.defaultValue === 'true'}
          onBlur={onFocusLeave}
          onChange={resetErrors}
          id={formField.id}
          name={formField.id}
          aria-describedby={parsedCustomFormConfig?.hint ? hintId : undefined}
          data-form-field-type="boolean"
        />
      </div>
      <div className="app-sdk-ml-3 app-sdk-text-sm">
        <label className="app-sdk-font-medium" htmlFor={formField.id}>
          {formField.label}
        </label>
        {!isValid && <h1 className="app-sdk-text-red-600">{errorMessage}</h1>}
        {parsedCustomFormConfig?.hint && (
          <p className="app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]" id={hintId}>
            {parsedCustomFormConfig.hint}
          </p>
        )}
      </div>
    </div>
  );
}
