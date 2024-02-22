import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function StringFormField(
  { formField, state }: DynamicUiComponentProps<string | null>,
  ref: DynamicUiFormFieldRef,
) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const inputType = parsedCustomFormConfig?.multiline === 'true' ? 'textarea' : 'input';
  const textInput = React.createElement(inputType, {
    className:
      'dynamic-ui-py-2 dynamic-ui-px-3 dynamic-ui-shadow-sm focus:dynamic-ui-ring-[color:var(--dui-focus-color)] focus:dynamic-ui-border-[color:var(--dui-focus-color)] dynamic-ui-block dynamic-ui-w-full sm:dynamic-ui-text-sm dynamic-ui-rounded-md dynamic-ui-border-[color:var(--dui-border-color)] invalid:dynamic-ui-border-[color:var(--dui-formfield-invalid-color)] invalid:dynamic-ui-ring-[color:var(--dui-formfield-invalid-color)] invalid:dynamic-ui-ring-1 dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dynamic-ui-bg-[color:var(--dui-formfield-background-color)] dark:focus:dynamic-ui-shadow-dynamicui-dark dynamic-ui-placeholder-[color:var(--dui-formfield-placeholder-text-color)] dark:invalid:dynamic-ui-shadow-dynamicui-dark-invalid',
    id: formField.id,
    name: formField.id,
    defaultValue: state || (formField.defaultValue?.toString() ?? ''),
    placeholder: parsedCustomFormConfig?.placeholder,
    'aria-describedby': parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined,
    type: inputType === 'input' ? 'text' : undefined,
    rows: inputType === 'textarea' ? 4 : undefined,
    'data-form-field-type': 'string',
  });

  const hint = parsedCustomFormConfig?.hint ? (
    <p
      id={`${formField.id}-hint`}
      className="dynamic-ui-mt-2 dynamic-ui-text-sm dynamic-ui-text-[color:var(--dui-formfield-hint-text-color)]"
    >
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="dynamic-ui-block dynamic-ui-text-sm dynamic-ui-font-medium" htmlFor={formField.id}>
        {label}
      </label>
      <div className="dynamic-ui-mt-1">{textInput}</div>
      {hint}
    </div>
  );
}
