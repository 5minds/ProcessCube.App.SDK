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
    <div className="dynamic-ui-relative dynamic-ui-flex dynamic-ui-items-start">
      <div className="dynamic-ui-flex dynamic-ui-h-5 dynamic-ui-items-center">
        <input
          type="checkbox"
          className="dark:dynamic-ui-bg-dynamicui-gray-350 dark:focus:dynamic-ui-shadow-dynamicui-dark dynamic-ui-h-4 dynamic-ui-w-4 dynamic-ui-rounded dynamic-ui-border-[color:var(--uic-border-color)] dynamic-ui-text-sky-600 focus:dynamic-ui-ring-[color:var(--uic-focus-color)] dark:dynamic-ui-border-2 dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:dynamic-ui-text-[#007bff40] dark:dynamic-ui-placeholder-gray-400 dark:focus:dynamic-ui-border-[#007bff40] dark:focus:dynamic-ui-ring-[#007bff40] "
          defaultChecked={(props.state && props.state !== 'false') || formField.defaultValue === 'true'}
          id={formField.id}
          name={formField.id}
          aria-describedby={parsedCustomFormConfig?.hint ? hintId : undefined}
          data-form-field-type="boolean"
        />
      </div>
      <div className="dynamic-ui-ml-3 dynamic-ui-text-sm">
        <label className="dynamic-ui-font-medium" htmlFor={formField.id}>
          {formField.label}
        </label>
        {parsedCustomFormConfig?.hint && (
          <p className="dynamic-ui-text[color:var(--uic-formfield-hint-text-color)]" id={hintId}>
            {parsedCustomFormConfig.hint}
          </p>
        )}
      </div>
    </div>
  );
}
