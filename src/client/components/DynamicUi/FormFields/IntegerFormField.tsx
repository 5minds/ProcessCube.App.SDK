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
      <label htmlFor={formField.id} className="dynamic-ui-block dynamic-ui-text-sm dynamic-ui-font-medium">
        {formField.label}
      </label>
      <div className="dynamic-ui-mt-1">
        <input
          className="dynamic-ui-bg-[color:var(--uic-formfield-background-color)] dark:focus:dynamic-ui-shadow-dynamicui-dark dark:invalid:dynamic-ui-shadow-dynamicui-dark-invalid dynamic-ui-block dynamic-ui-w-full dynamic-ui-rounded-md dynamic-ui-border-[color:var(--uic-border-color)] dynamic-ui-shadow-sm invalid:dynamic-ui-border-[color:var(--uic-formfield-invalid-color)] invalid:dynamic-ui-ring-1 invalid:dynamic-ui-ring-[color:var(--uic-formfield-invalid-color)] focus:dynamic-ui-border-[color:var(--uic-focus-color)] focus:dynamic-ui-ring-[color:var(--uic-focus-color)] sm:dynamic-ui-text-sm dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dynamic-ui-placeholder-[color:var(--uic-formfield-placeholder-text-color)]"
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
        <p id={`${formField.id}-hint`} data-hint className="dynamic-ui-text-[color:var(--uic-formfield-hint-text-color)] dynamic-ui-mt-2 dynamic-ui-text-sm">
          {parsedCustomFormConfig.hint}
        </p>
      )}
    </div>
  );
}
