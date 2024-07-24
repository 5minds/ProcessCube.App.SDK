import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { isNumber } from '../utils/isNumber';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function NumberFormField(props: DynamicUiComponentProps<string | null>, ref: DynamicUiFormFieldRef) {
  const { formField, state } = props;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);
  console.log('NumberFormField:', parsedCustomFormConfig);

  if (!isNumber(formField.defaultValue)) {
    console.warn(`[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for number field "${formField.id}"`);
  }

  return (
    <div>
      <label htmlFor={formField.id} className="app-sdk-block app-sdk-text-sm app-sdk-font-medium">
        {formField.label}
      </label>
      <div className="app-sdk-mt-1">
        <input
          className="app-sdk-form-input app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-py-2 app-sdk-px-3 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] app-sdk-shadow-sm invalid:app-sdk-border-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-1 invalid:app-sdk-ring-[color:var(--asdk-dui-formfield-invalid-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:invalid:app-sdk-shadow-app-sdk-dark-invalid dark:focus:app-sdk-shadow-app-sdk-dark"
          type="number"
          step={1}
          id={formField.id}
          name={formField.id}
          defaultValue={state || formField.defaultValue?.toString()}
          placeholder={parsedCustomFormConfig?.placeholder ?? '0'}
          aria-describedby={`${formField.id}-hint`}
          data-form-field-type="number"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p
          className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
          id={`${formField.id}-hint`}
          data-hint
        >
          {parsedCustomFormConfig.hint}
        </p>
      )}
    </div>
  );
}

// export function DecimalFormField(props: DynamicUiComponentProps<string | null>, ref: DynamicUiFormFieldRef) {
//   return <input step="0.01" placeholder={parsedCustomFormConfig?.placeholder || '0.00'} />;
// }
