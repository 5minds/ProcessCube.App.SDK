import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function EnumFormField(
  { formField, state }: DynamicUiComponentProps<string | Array<string> | null>,
  ref: DynamicUiFormFieldRef,
) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const options = formField.enumValues;

  let enumInput: JSX.Element;
  enumInput = (
    <fieldset
      id={formField.id}
      className="app-sdk-pl-0 app-sdk-pb-0 app-sdk-space-y-2"
      data-type="radio"
      aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
      data-form-field-type="enum"
    >
      {options?.map((option) => {
        return (
          <div key={option.id} className="app-sdk-relative app-sdk-flex app-sdk-items-start">
            <div className="app-sdk-flex app-sdk-h-5 app-sdk-items-center">
              <input
                type="radio"
                defaultChecked={(state || formField.defaultValue) == option.id}
                name={formField.id}
                id={option.id}
                value={option.id}
                className="app-sdk-form-radio app-sdk-border app-sdk-h-4 app-sdk-w-4 app-sdk-rounded app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-text-[color:var(--asdk-dui-formfield-checkbox-text-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] dark:app-sdk-border-2 dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark"
              />
            </div>
            <div className="app-sdk-ml-3 app-sdk-text-sm">
              <label
                htmlFor={option.id}
                className="app-sdk-font-medium app-sdk-text-[color:var(--asdk-dui-text-color)]"
              >
                {option.name}
              </label>
            </div>
          </div>
        );
      })}
    </fieldset>
  );

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
      {enumInput}
      {hint}
    </div>
  );
}
