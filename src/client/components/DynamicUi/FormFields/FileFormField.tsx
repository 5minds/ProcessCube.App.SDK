import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function FileFormField(props: DynamicUiComponentProps<File | null>, ref: DynamicUiFormFieldRef) {
  const { formField, state } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);
  const options = formField.enumValues;

  let multipleStateOrDefaultValue: any[];
  if (Array.isArray(state) && state.length) {
    multipleStateOrDefaultValue = state;
  } else {
    multipleStateOrDefaultValue = ((state as string | null) || formField.defaultValue?.toString())?.split(',') ?? [];
  }

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <input
        className="app-sdk-form-input app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-py-2 app-sdk-px-3 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] app-sdk-shadow-sm focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark"
        type="file"
        id={formField.id}
        name={formField.id}
        aria-describedby={hintId}
        data-form-field-type="file"
      >
        {options?.map((option) => {
          const hasValueToBeChecked = multipleStateOrDefaultValue.find((value) => value.trim() === option.id);

          return (
            <div key={option.id} className="app-sdk-relative app-sdk-flex app-sdk-items-start">
              <div className="app-sdk-flex app-sdk-h-5 app-sdk-items-center">
                <input
                  type="checkbox"
                  defaultChecked={hasValueToBeChecked}
                  name={formField.id}
                  id={option.id}
                  value={option.id}
                  className="app-sdk-form-checkbox app-sdk-border app-sdk-h-4 app-sdk-w-4 app-sdk-rounded app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-text-[color:var(--asdk-dui-formfield-checkbox-text-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] dark:app-sdk-border-2 dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark"
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
      </input>
      {parsedCustomFormConfig?.hint && (
        <p
          className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
          id={hintId}
        >
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}
