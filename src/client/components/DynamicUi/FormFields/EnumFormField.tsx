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
                    className="dark:dynamic-ui-bg-dynamicui-gray-350 dark:focus:dynamic-ui-shadow-dynamicui-dark dynamic-ui-h-4 dynamic-ui-w-4 dynamic-ui-rounded dynamic-ui-border-[color:var(--uic-border-color)] dynamic-ui-text-sky-600 focus:dynamic-ui-ring-[color:var(--uic-focus-color)] dark:dynamic-ui-border-2 dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:dynamic-ui-text-[#007bff40] dark:dynamic-ui-placeholder-gray-400 dark:focus:dynamic-ui-border-[#007bff40] dark:focus:dynamic-ui-ring-[#007bff40]"
                  />
                </div>
                <div className="dynamic-ui-ml-3 dynamic-ui-text-sm">
                  <label htmlFor={option.id} className="dark:dynamic-ui-text-dynamicui-gray-50 dynamic-ui-font-medium dynamic-ui-text-gray-700">
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
                    className="dark:dynamic-ui-bg-dynamicui-gray-350 dark:focus:dynamic-ui-shadow-dynamicui-dark dynamic-ui-h-4 dynamic-ui-w-4 dynamic-ui-rounded dynamic-ui-border-[color:var(--uic-border-color)] dynamic-ui-text-sky-600 focus:dynamic-ui-ring-[color:var(--uic-focus-color)] dark:dynamic-ui-border-2 dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:dynamic-ui-text-[#007bff40] dark:dynamic-ui-placeholder-gray-400 dark:focus:dynamic-ui-border-[#007bff40] dark:focus:dynamic-ui-ring-[#007bff40]"
                  />
                </div>
                <div className="dynamic-ui-ml-3 dynamic-ui-text-sm">
                  <label htmlFor={option.id} className="dark:dynamic-ui-text-dynamicui-gray-50 dynamic-ui-font-medium dynamic-ui-text-gray-700">
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
          className="dark:dynamic-ui-bg-dynamicui-gray-350 dark:focus:dynamic-ui-shadow-dynamicui-dark dark:invalid:dynamic-ui-shadow-dynamicui-dark-invalid dark:dynamic-ui-bg-dynamicui-dropdown-dark dynamic-ui-mt-1 dynamic-ui-block dynamic-ui-w-full dynamic-ui-rounded-md dynamic-ui-border-[color:var(--uic-border-color)] dynamic-ui-py-2 dynamic-ui-pl-3 dynamic-ui-pr-10 dynamic-ui-text-base invalid:dynamic-ui-border-red-500 invalid:dynamic-ui-ring-1 invalid:dynamic-ui-ring-red-500 focus:dynamic-ui-border-[color:var(--uic-focus-color)] focus:dynamic-ui-outline-none focus:dynamic-ui-ring-[color:var(--uic-focus-color)] sm:dynamic-ui-text-sm dark:dynamic-ui-border-solid dark:dynamic-ui-border-transparent dark:dynamic-ui-placeholder-gray-400 dark:invalid:dynamic-ui-border-[#dc35467f] dark:invalid:dynamic-ui-ring-[#dc35467f] dark:focus:dynamic-ui-border-[#007bff40] dark:focus:dynamic-ui-ring-[#007bff40]"
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
    <p id={`${formField.id}-hint`} className="dark:dynamic-ui-text-dynamicui-gray-200 dynamic-ui-mt-2 dynamic-ui-text-sm dynamic-ui-text-gray-500">
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
