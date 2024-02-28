import React from 'react';

import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';
import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { isNumber } from '../utils/isNumber';

export function IntegerFormField(
  { formField, state }: DynamicUiComponentProps<string | null>,
  ref: DynamicUiFormFieldRef,
) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  if (!isNumber(formField.defaultValue)) {
    console.warn(
      `[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for integer field "${formField.id}"`,
    );
  }

  return (
    <div>
      <label htmlFor={formField.id} className="app-sdk-block app-sdk-text-sm app-sdk-font-medium">
        {formField.label}
      </label>
      <div className="app-sdk-mt-1">
        <input
          className="app-sdk-border app-sdk-py-2 app-sdk-px-3 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--dui-border-color)] app-sdk-bg-[color:var(--dui-formfield-background-color)] app-sdk-placeholder-[color:var(--dui-formfield-placeholder-text-color)] app-sdk-shadow-sm invalid:app-sdk-border-[color:var(--dui-formfield-invalid-color)] invalid:app-sdk-ring-1 invalid:app-sdk-ring-[color:var(--dui-formfield-invalid-color)] focus:app-sdk-border-[color:var(--dui-focus-color)] focus:app-sdk-ring-[color:var(--dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:invalid:app-sdk-shadow-dynamicui-dark-invalid dark:focus:app-sdk-shadow-dynamicui-dark"
          type="number"
          step={1}
          id={formField.id}
          name={formField.id}
          defaultValue={state || formField.defaultValue?.toString()}
          placeholder={parsedCustomFormConfig?.placeholder ?? '0'}
          aria-describedby={`${formField.id}-hint`}
          data-form-field-type="integer"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p
          id={`${formField.id}-hint`}
          data-hint
          className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--dui-formfield-hint-text-color)]"
        >
          {parsedCustomFormConfig.hint}
        </p>
      )}
    </div>
  );
}
