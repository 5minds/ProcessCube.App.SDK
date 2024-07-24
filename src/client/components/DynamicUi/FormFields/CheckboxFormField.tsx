import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function CheckboxFormField(props: DynamicUiComponentProps<boolean>, ref: DynamicUiFormFieldRef) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div className="app-sdk-mt-4">
      <div className="app-sdk-flex app-sdk-items-start">
        <div className="app-sdk-flex app-sdk-h-5 app-sdk-items-center">
          <input
            className="app-sdk-form-checkbox app-sdk-border app-sdk-h-4 app-sdk-w-4 app-sdk-rounded app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-text-[color:var(--asdk-dui-formfield-checkbox-text-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] dark:app-sdk-border-2 dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark"
            type="checkbox"
            id={formField.id}
            name={formField.id}
            aria-describedby={hintId}
            data-form-field-type="checkbox"
          />
        </div>
        <div className="app-sdk-ml-3 app-sdk-text-sm">
          <label className="app-sdk-font-medium" htmlFor={formField.id}>
            {formField.label}
          </label>
          {parsedCustomFormConfig?.hint && (
            <p
              className="app-sdk-mt-1 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
              id={hintId}
            >
              {parsedCustomFormConfig?.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
