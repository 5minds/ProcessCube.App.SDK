import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';
import { isNumber } from '../utils/isNumber';

export function DecimalFormField(props: DynamicUiComponentProps<string | null>, ref: DynamicUiFormFieldRef) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  if (!isNumber(formField.defaultValue)) {
    console.warn(
      `[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for decimal field "${formField.id}"`,
    );
  }

  return (
    <div>
      <label className="dynamic-ui-block dynamic-ui-text-sm dynamic-ui-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="dynamic-ui-mt-1">
        <input
          className="dynamic-ui-border dynamic-ui-py-2 dynamic-ui-px-3 dynamic-ui-block dynamic-ui-w-full dynamic-ui-rounded-md dynamic-ui-border-[color:var(--dui-border-color)] dynamic-ui-bg-[color:var(--dui-formfield-background-color)] dynamic-ui-placeholder-[color:var(--dui-formfield-placeholder-text-color)] dynamic-ui-shadow-sm invalid:dynamic-ui-border-[color:var(--dui-formfield-invalid-color)] invalid:dynamic-ui-ring-1 invalid:dynamic-ui-ring-[color:var(--dui-formfield-invalid-color)] focus:dynamic-ui-border-[color:var(--dui-focus-color)] focus:dynamic-ui-ring-[color:var(--dui-focus-color)] sm:dynamic-ui-text-sm dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:invalid:dynamic-ui-shadow-dynamicui-dark-invalid dark:focus:dynamic-ui-shadow-dynamicui-dark"
          type="number"
          step="0.01"
          placeholder={parsedCustomFormConfig?.placeholder || '0.00'}
          defaultValue={props.state || formField.defaultValue?.toString()}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="decimal"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p
          className="dynamic-ui-mt-2 dynamic-ui-text-sm dynamic-ui-text-[color:var(--dui-formfield-hint-text-color)]"
          id={hintId}
        >
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}
