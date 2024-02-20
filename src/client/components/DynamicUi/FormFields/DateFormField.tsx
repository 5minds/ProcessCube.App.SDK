import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function DateFormField(props: DynamicUiComponentProps<string | null>, ref: DynamicUiFormFieldRef) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  if (!isValidDate(formField.defaultValue)) {
    console.warn(`[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for date field "${formField.id}"`);
  }

  const defaultValue = props.state || formField.defaultValue?.toString();

  return (
    <div>
      <label className="dynamic-ui-block dynamic-ui-text-sm dynamic-ui-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="dynamic-ui-mt-1">
        <input
          className="dark:dynamic-ui-bg-dynamicui-gray-350 dark:focus:dynamic-ui-shadow-dynamicui-dark dark:invalid:dynamic-ui-shadow-dynamicui-dark-invalid dynamic-ui-block dynamic-ui-w-full dynamic-ui-rounded-md dynamic-ui-border-[color:var(--uic-border-color)] dynamic-ui-shadow-sm invalid:dynamic-ui-border-red-500 invalid:dynamic-ui-ring-1 invalid:dynamic-ui-ring-red-500 focus:dynamic-ui-border-[color:var(--uic-focus-color)] focus:dynamic-ui-ring-[color:var(--uic-focus-color)] sm:dynamic-ui-text-sm dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:dynamic-ui-placeholder-gray-400 dark:invalid:dynamic-ui-border-[#dc35467f] dark:invalid:dynamic-ui-ring-[#dc35467f] dark:focus:dynamic-ui-border-[#007bff40] dark:focus:dynamic-ui-ring-[#007bff40]"
          type="date"
          defaultValue={defaultValue}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="date"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p className="dark:dynamic-ui-text-dynamicui-gray-200 dynamic-ui-mt-2 dynamic-ui-text-sm dynamic-ui-text-gray-500" id={hintId}>
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}

function isValidDate(value: any) {
  return new Date(value?.toString()).toString() !== 'Invalid Date';
}
