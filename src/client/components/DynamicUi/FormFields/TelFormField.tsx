import React from 'react';

import { classNames } from '../../../utils/classNames';
import { DynamicUiComponentProps } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function TelFormField({ formField, state }: DynamicUiComponentProps<string>) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const hintId = `${formField.id}-hint`;

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="app-sdk-mt-1">
        <input
          className={classNames(
            'app-sdk-form-input app-sdk-block app-sdk-w-full app-sdk-appearance-none app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] app-sdk-pl-3 app-sdk-pr-3', // Adjust padding as needed
          )}
          id={formField.id}
          name={formField.id}
          type="tel"
          defaultValue={state || (formField.defaultValue?.toString() ?? '')}
          placeholder={parsedCustomFormConfig?.placeholder}
          aria-describedby={parsedCustomFormConfig?.hint ? hintId : undefined}
          data-form-field-type="tel"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]" id={hintId}>
          {parsedCustomFormConfig.hint}
        </p>
      )}
    </div>
  );
}
