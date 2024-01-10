import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function BooleanFormField(
  props: DynamicUiComponentProps<string | null>,
  ref: DynamicUiFormFieldRef,
): JSX.Element {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div className="relative flex items-start">
      <div className="flex h-5 items-center">
        <input
          type="checkbox"
          className="dark:bg-dynamicui-gray-350 dark:focus:shadow-dynamicui-dark h-4 w-4 rounded border-[color:var(--uic-border-color)] text-sky-600 focus:ring-[color:var(--uic-focus-color)] dark:border-2 dark:border-solid dark:border-transparent dark:text-[#007bff40] dark:placeholder-gray-400   dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40] "
          defaultChecked={(props.state && props.state !== 'false') || formField.defaultValue === 'true'}
          id={formField.id}
          name={formField.id}
          aria-describedby={parsedCustomFormConfig?.hint ? hintId : undefined}
          data-form-field-type="boolean"
        />
      </div>
      <div className="ml-3 text-sm">
        <label className="font-medium" htmlFor={formField.id}>
          {formField.label}
        </label>
        {parsedCustomFormConfig?.hint && (
          <p className="dark:text-dynamicui-gray-200 text-gray-500" id={hintId}>
            {parsedCustomFormConfig.hint}
          </p>
        )}
      </div>
    </div>
  );
}
