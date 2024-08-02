import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function RadioFormField(
  { formField, state }: DynamicUiComponentProps<string | Array<Object> | null>,
  ref: DynamicUiFormFieldRef,
) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);
  const options = parsedCustomFormConfig?.entries;
  const hintId = `${formField.id}-hint`;

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <input
        className="app-sdk-pl-0 app-sdk-pb-0 app-sdk-space-y-2"
        type="radio"
        id={formField.id}
        name={formField.id}
        aria-describedby={hintId}
        data-form-field-type="radio"
      >
        {options?.map((option: any) => {
          return (
            <div key={option.key} className="app-sdk-relative app-sdk-flex app-sdk-items-start">
              <div className="app-sdk-flex app-sdk-h-5 app-sdk-items-center">
                <input
                  type="radio"
                  defaultChecked={(state || formField.defaultValue) == option.key}
                  name={formField.id}
                  id={option.key}
                  value={option.key}
                  className="app-sdk-form-radio app-sdk-border app-sdk-h-4 app-sdk-w-4 app-sdk-rounded app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-text-[color:var(--asdk-dui-formfield-checkbox-text-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] dark:app-sdk-border-2 dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark"
                />
              </div>
              <div className="app-sdk-ml-3 app-sdk-text-sm">
                <label
                  htmlFor={option.key}
                  className="app-sdk-font-medium app-sdk-text-[color:var(--asdk-dui-text-color)]"
                >
                  {option.value}
                </label>
              </div>
            </div>
          );
        })}
      </input>
      {parsedCustomFormConfig?.hint && (
        <p
          className="app-sdk-mt-1 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
          id={hintId}
        >
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}
