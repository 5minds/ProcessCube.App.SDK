import React from 'react';

import type { DataModels } from '@5minds/processcube_engine_sdk';

import { DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

type IStringFormFieldProps = {
  formField: DataModels.FlowNodeInstances.UserTaskFormField;
  state?: string | null;
};

export function StringFormField({ formField, state }: IStringFormFieldProps, ref: DynamicUiFormFieldRef) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const inputType = parsedCustomFormConfig?.multiline === 'true' ? 'textarea' : 'input';
  const textInput = React.createElement(inputType, {
    className:
      'shadow-sm focus:ring-[color:var(--uic-focus-color)] focus:border-[color:var(--uic-focus-color)] block w-full sm:text-sm rounded-md border-[color:var(--uic-border-color)] invalid:border-red-500 invalid:ring-red-500 invalid:ring-1 dark:border-solid dark:border-transparent dark:bg-dynamicui-gray-350 dark:focus:shadow-dynamicui-dark dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] dark:placeholder-gray-400 dark:invalid:shadow-dynamicui-dark-invalid dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f]',
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
    <p id={`${formField.id}-hint`} className="dark:text-dynamicui-gray-200 mt-2 text-sm text-gray-500">
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={formField.id}>
        {label}
      </label>
      <div className="mt-1">{textInput}</div>
      {hint}
    </div>
  );
}
