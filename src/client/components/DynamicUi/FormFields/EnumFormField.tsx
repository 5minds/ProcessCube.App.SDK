import React, { useState } from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function EnumFormField(
  { formField, state, onValidate }: DynamicUiComponentProps<string | Array<string> | null>,
  ref: DynamicUiFormFieldRef,
) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;
  const options = formField.enumValues;

  let enumInput: JSX.Element;

  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  function onFocusLeave(e: any) {
    if (onValidate) {
      onValidate(
        formField.id,
        formField.type,
        formField.enumValues
          ?.filter((ele) => ele.id === e.target.value)
          .map((ele) => {
            return { name: ele.name, value: e.target.checked };
          })[0],
      ).then((res) => {
        setErrorMessage(res.join('\n'));
        setIsValid(false);
      });
    }
  }

  function resetErrors() {
    setErrorMessage('');
    setIsValid(true);
  }

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
          className="app-sdk-pl-0 app-sdk-pb-0 app-sdk-space-y-2"
          data-type="checkbox"
          aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
          data-form-field-type="enum"
        >
          {options?.map((option) => {
            const hasValueToBeChecked = multipleStateOrDefaultValue.find((value) => value.trim() === option.id);

            return (
              <div key={option.id} className="app-sdk-relative app-sdk-flex app-sdk-items-start">
                <div className="app-sdk-flex app-sdk-h-5 app-sdk-items-center">
                  <input
                    type="checkbox"
                    onBlur={onFocusLeave}
                    onChange={resetErrors}
                    defaultChecked={hasValueToBeChecked}
                    // Use the formField id to set the value to the correct id on FormData
                    name={formField.id}
                    id={option.id}
                    value={option.id}
                    className={`${!isValid ? 'app-sdk-bg-red-600/20' : 'app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)]'} app-sdk-form-checkbox app-sdk-border app-sdk-h-4 app-sdk-w-4 app-sdk-rounded app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-text-[color:var(--asdk-dui-formfield-checkbox-text-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] dark:app-sdk-border-2 dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark`}
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
      break;
    case 'radio':
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
                    onBlur={onFocusLeave}
                    onChange={resetErrors}
                    id={option.id}
                    value={option.id}
                    className={`${!isValid ? 'app-sdk-bg-red-600/20' : 'app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)]'} app-sdk-form-radio app-sdk-border app-sdk-h-4 app-sdk-w-4 app-sdk-rounded app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-text-[color:var(--asdk-dui-formfield-checkbox-text-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] dark:app-sdk-border-2 dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:focus:app-sdk-shadow-app-sdk-dark`}
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
      break;
    default:
      const defaultSelect = state || options?.find((option) => option.id === formField.defaultValue)?.id || '';

      enumInput = (
        <select
          id={formField.id}
          name={formField.id}
          className={` ${!isValid ? 'app-sdk-bg-red-600/20' : 'app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)]'} app-sdk-form-select app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-mt-1 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-py-2 app-sdk-pl-3 app-sdk-pr-10 app-sdk-text-base app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] invalid:app-sdk-border-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-1 invalid:app-sdk-ring-[color:var(--asdk-dui-formfield-invalid-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-outline-none focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:app-sdk-bg-app-sdk-dropdown-dark dark:invalid:app-sdk-shadow-app-sdk-dark-invalid dark:focus:app-sdk-shadow-app-sdk-dark`}
          onChange={(event) => {
            event.target.dataset.value = event.target.value;
            resetErrors();
          }}
          onBlur={onFocusLeave}
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
      {!isValid && <pre className="app-sdk-text-red-600">{errorMessage}</pre>}
    </div>
  );
}
