import React, { Fragment, PropsWithChildren, useState } from 'react';

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
        multipleStateOrDefaultValue = formField.defaultValue?.toString().split(',') ?? [];
      }

      enumInput = (
        <fieldset
          id={formField.id}
          className="mt-1 space-y-2"
          data-type="checkbox"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
        >
          {options?.map((option) => {
            const hasValueToBeChecked = multipleStateOrDefaultValue.find((value) => value.trim() === option.id);

            return (
              <div key={option.id} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    defaultChecked={hasValueToBeChecked}
                    // Use the formField id to set the value to the correct id on FormData
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="dark:bg-dynamicui-gray-350 dark:focus:shadow-dynamicui-dark h-4 w-4 rounded border-[color:var(--uic-border-color)] text-sky-600 focus:ring-[color:var(--uic-focus-color)] dark:border-2 dark:border-solid dark:border-transparent dark:text-[#007bff40] dark:placeholder-gray-400 dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={option.id} className="dark:text-dynamicui-gray-50 font-medium text-gray-700">
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
          className="mt-1 space-y-2"
          data-type="radio"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
        >
          {options?.map((option) => {
            return (
              <div key={option.id} className="relative flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="radio"
                    checked={(state || formField.defaultValue) == option.id}
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className="dark:bg-dynamicui-gray-350 dark:focus:shadow-dynamicui-dark h-4 w-4 rounded border-[color:var(--uic-border-color)] text-sky-600 focus:ring-[color:var(--uic-focus-color)] dark:border-2 dark:border-solid dark:border-transparent dark:text-[#007bff40] dark:placeholder-gray-400 dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={option.id} className="dark:text-dynamicui-gray-50 font-medium text-gray-700">
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
      const [defaultSelected, setDefaultSelected] = useState<string>('');
      const Select = (props: PropsWithChildren<any>) => (
        <select
          id={formField.id}
          name={formField.id}
          className="dark:bg-dynamicui-gray-350 dark:focus:shadow-dynamicui-dark dark:invalid:shadow-dynamicui-dark-invalid dark:bg-dynamicui-dropdown-dark mt-1 block w-full rounded-md border-[color:var(--uic-border-color)] py-2 pl-3 pr-10 text-base invalid:border-red-500 invalid:ring-1 invalid:ring-red-500 focus:border-[color:var(--uic-focus-color)] focus:outline-none focus:ring-[color:var(--uic-focus-color)] sm:text-sm dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f] dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
          onChange={(event) => {
            event.target.dataset.value = event.target.value;
            setDefaultSelected(event.target.value);
          }}
          data-value
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
          {...props}
        >
          {props.children}
        </select>
      );

      const DefaultOption = (props: PropsWithChildren<any>) => {
        const { children, ...rest } = props;
        return (
          <option disabled hidden style={{ display: 'none' }} value="" {...rest}>
            {children}
          </option>
        );
      };

      const Options = () => (
        <Fragment>
          {options?.map((option) => {
            const defaultSelected = (state || formField.defaultValue) === option.id;
            if (defaultSelected) {
              setDefaultSelected(option.id);
            }

            return (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            );
          })}
        </Fragment>
      );

      enumInput = (
        <Select data-value={defaultSelected} value={defaultSelected}>
          <DefaultOption>{!defaultSelected && parsedCustomFormConfig?.placeholder}</DefaultOption>
          <Options />
        </Select>
      );
      break;
  }

  const hint = parsedCustomFormConfig?.hint ? (
    <p id={`${formField.id}-hint`} className="dark:text-dynamicui-gray-200 mt-2 text-sm text-gray-500">
      {parsedCustomFormConfig.hint}
    </p>
  ) : null;

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={formField.id}>
        {label}
      </label>
      {enumInput}
      {hint}
    </div>
  );
}
