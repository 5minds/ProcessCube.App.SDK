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
          className="dynamic-ui-border dynamic-ui-h-4 dynamic-ui-w-4 dynamic-ui-rounded dynamic-ui-border-[color:var(--dui-border-color)] dynamic-ui-bg-[color:var(--dui-formfield-background-color)] dynamic-ui-text-[color:var(--dui-formfield-checkbox-text-color)] dynamic-ui-placeholder-[color:var(--dui-formfield-placeholder-text-color)] focus:dynamic-ui-border-[color:var(--dui-focus-color)] focus:dynamic-ui-ring-[color:var(--dui-focus-color)] dark:dynamic-ui-border-2 dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:focus:dynamic-ui-shadow-dynamicui-dark"
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
          <p className="dynamic-ui-text-[color:var(--dui-formfield-hint-text-color)]" id={hintId}>
            {parsedCustomFormConfig.hint}
          </p>
        )}
      </div>
    </div>
  );
}
