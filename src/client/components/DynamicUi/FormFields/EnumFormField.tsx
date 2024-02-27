import React from 'react';

import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';
import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';

export function EnumFormField(
  { formField, state }: DynamicUiComponentProps<string | Array<string> | null>,
  ref: DynamicUiFormFieldRef,
) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const options = formField.enumValues;

  let enumInput: JSX.Element;

  switch (parsedCustomFormConfig?.displayAs) {
    case 'checkbox':
      let multipleStateOrDefaultValue: any[];
      if (Array.isArray(state) && state.length) {
        multipleStateOrDefaultValue = state;
      } else {
        multipleStateOrDefaultValue =
          ((state as string | null) || formField.defaultValue?.toString())?.split(',') ?? [];
      }

      enumInput = (
        <fieldset
          id={formField.id}
          className="dynamic-ui-mt-1 dynamic-ui-space-y-2"
          data-type="checkbox"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
        >
          {options?.map((option) => {
            const hasValueToBeChecked = multipleStateOrDefaultValue.find((value) => value.trim() === option.id);

            return (
              <div key={option.id} className="dynamic-ui-relative dynamic-ui-flex dynamic-ui-items-start">
                <div className="dynamic-ui-flex dynamic-ui-h-5 dynamic-ui-items-center">
                  <input
                    type="checkbox"
                    defaultChecked={hasValueToBeChecked}
                    // Use the formField id to set the value to the correct id on FormData
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="dynamic-ui-border dynamic-ui-h-4 dynamic-ui-w-4 dynamic-ui-rounded dynamic-ui-border-[color:var(--dui-border-color)] dynamic-ui-bg-[color:var(--dui-formfield-background-color)] dynamic-ui-text-[color:var(--dui-formfield-checkbox-text-color)] dynamic-ui-placeholder-[color:var(--dui-formfield-placeholder-text-color)] focus:dynamic-ui-border-[color:var(--dui-focus-color)] focus:dynamic-ui-ring-[color:var(--dui-focus-color)] dark:dynamic-ui-border-2 dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:focus:dynamic-ui-shadow-dynamicui-dark"
                  />
                </div>
                <div className="dynamic-ui-ml-3 dynamic-ui-text-sm">
                  <label
                    htmlFor={option.id}
                    className="dynamic-ui-font-medium dynamic-ui-text-[color:var(--dui-text-color)]"
                  >
                    {option.name}
                  </label>
                </div>
              </div>
            );
          })}
        </fieldset>
      );
      break;
    // state wiederherstellung testen
    case 'radio':
      enumInput = (
        <fieldset
          id={formField.id}
          className="dynamic-ui-mt-1 dynamic-ui-space-y-2"
          data-type="radio"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
        >
          {options?.map((option) => {
            return (
              <div key={option.id} className="dynamic-ui-relative dynamic-ui-flex dynamic-ui-items-start">
                <div className="dynamic-ui-flex dynamic-ui-h-5 dynamic-ui-items-center">
                  <input
                    type="radio"
                    defaultChecked={(state || formField.defaultValue) == option.id}
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="dynamic-ui-border dynamic-ui-h-4 dynamic-ui-w-4 dynamic-ui-rounded dynamic-ui-border-[color:var(--dui-border-color)] dynamic-ui-bg-[color:var(--dui-formfield-background-color)] dynamic-ui-text-[color:var(--dui-formfield-checkbox-text-color)] dynamic-ui-placeholder-[color:var(--dui-formfield-placeholder-text-color)] focus:dynamic-ui-border-[color:var(--dui-focus-color)] focus:dynamic-ui-ring-[color:var(--dui-focus-color)] dark:dynamic-ui-border-2 dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:focus:dynamic-ui-shadow-dynamicui-dark"
                  />
                </div>
                <div className="dynamic-ui-ml-3 dynamic-ui-text-sm">
                  <label
                    htmlFor={option.id}
                    className="dynamic-ui-font-medium dynamic-ui-text-[color:var(--dui-text-color)]"
                  >
                    {option.name}
                  </label>
                </div>
              </div>
            );
          })}
        </fieldset>
      );
      break;
    default:
      const defaultSelect = state || options?.find((option) => option.id === formField.defaultValue)?.id || '';

      enumInput = (
        <select
          id={formField.id}
          name={formField.id}
          className="dynamic-ui-border dynamic-ui-mt-1 dynamic-ui-block dynamic-ui-w-full dynamic-ui-rounded-md dynamic-ui-border-[color:var(--dui-border-color)] dynamic-ui-bg-[color:var(--dui-formfield-background-color)] dynamic-ui-py-2 dynamic-ui-pl-3 dynamic-ui-pr-10 dynamic-ui-text-base dynamic-ui-placeholder-[color:var(--dui-formfield-placeholder-text-color)] invalid:dynamic-ui-border-[color:var(--dui-formfield-invalid-color)] invalid:dynamic-ui-ring-1 invalid:dynamic-ui-ring-[color:var(--dui-formfield-invalid-color)] focus:dynamic-ui-border-[color:var(--dui-focus-color)] focus:dynamic-ui-outline-none focus:dynamic-ui-ring-[color:var(--dui-focus-color)] sm:dynamic-ui-text-sm dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:dynamic-ui-bg-dynamicui-dropdown-dark dark:invalid:dynamic-ui-shadow-dynamicui-dark-invalid dark:focus:dynamic-ui-shadow-dynamicui-dark"
          onChange={(event) => (event.target.dataset.value = event.target.value)}
          data-value={defaultSelect}
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
          defaultValue={defaultSelect}
        >
          <option value="">{!defaultSelect && parsedCustomFormConfig?.placeholder}</option>
          {options?.map((option) => {
            return (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            );
          })}
        </select>
      );
      break;
  }

  const hint = parsedCustomFormConfig?.hint ? (
    <p
      id={`${formField.id}-hint`}
      className="dynamic-ui-mt-2 dynamic-ui-text-sm dynamic-ui-text-[color:var(--dui-formfield-hint-text-color)]"
    >
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="dynamic-ui-block dynamic-ui-text-sm dynamic-ui-font-medium" htmlFor={formField.id}>
        {label}
      </label>
      {enumInput}
      {hint}
    </div>
  );
}
