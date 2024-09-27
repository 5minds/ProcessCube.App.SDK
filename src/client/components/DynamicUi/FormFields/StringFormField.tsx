import React, { forwardRef } from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export const StringFormField = forwardRef(function StringFormField(
  { formField, state }: DynamicUiComponentProps<string | null>,
  ref: DynamicUiFormFieldRef,
) {
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const defaultValue = state || (formField.defaultValue?.toString() ?? '');

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="app-sdk-mt-1">
        <input
          className="app-sdk-form-input app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-py-2 app-sdk-px-3 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] app-sdk-shadow-sm focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark"
          type="text"
          defaultValue={defaultValue}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="text"
          placeholder={parsedCustomFormConfig?.placeholder}
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
    </div>
  );
});
