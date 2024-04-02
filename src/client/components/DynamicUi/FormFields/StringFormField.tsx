import React from 'react';

import { classNames } from '../../../utils/classNames';
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
    className: classNames(
      inputType === 'input' ? 'app-sdk-form-input' : 'app-sdk-form-textarea',
      'app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-py-2 app-sdk-px-3 app-sdk-shadow-sm focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] app-sdk-block app-sdk-w-full sm:app-sdk-text-sm app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] invalid:app-sdk-border-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-1 dark:app-sdk-border-solid dark:app-sdk-border-transparent app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] dark:focus:app-sdk-shadow-app-sdk-dark app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] dark:invalid:app-sdk-shadow-app-sdk-dark-invalid',
    ),
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
      className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
    >
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {label}
      </label>
      <div className="app-sdk-mt-1">{textInput}</div>
      {hint}
    </div>
  );
}
