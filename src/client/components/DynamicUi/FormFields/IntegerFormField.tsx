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
      <label htmlFor={formField.id} className="block text-sm font-medium">
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="dark:bg-dynamicui-gray-350 dark:focus:shadow-dynamicui-dark dark:invalid:shadow-dynamicui-dark-invalid block w-full rounded-md border-[color:var(--uic-border-color)] shadow-sm invalid:border-red-500 invalid:ring-1 invalid:ring-red-500 focus:border-[color:var(--uic-focus-color)] focus:ring-[color:var(--uic-focus-color)] sm:text-sm dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f] dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
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
        <p id={`${formField.id}-hint`} data-hint className="dark:text-dynamicui-gray-200 mt-2 text-sm text-gray-500">
          {parsedCustomFormConfig.hint}
        </p>
      )}
    </div>
  );
}
