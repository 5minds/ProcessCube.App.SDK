import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function TimeFormField(props: DynamicUiComponentProps<string | null>, ref: DynamicUiFormFieldRef) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  if (!isValidTime(formField.defaultValue)) {
    console.warn(`[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for time field "${formField.id}"`);
  }

  const defaultValue = props.state || formField.defaultValue?.toString();

  return (
    <div>
      <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="app-sdk-mt-1">
        <input
          className="app-sdk-form-input app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-py-2 app-sdk-px-3 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] app-sdk-shadow-sm invalid:app-sdk-border-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-1 invalid:app-sdk-ring-[color:var(--asdk-dui-formfield-invalid-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:invalid:app-sdk-shadow-app-sdk-dark-invalid dark:focus:app-sdk-shadow-app-sdk-dark"
          type="time"
          defaultValue={defaultValue}
          id={formField.id}
          name={formField.id}
          placeholder={parsedCustomFormConfig?.placeholder || 'hh:mm:ss'}
          aria-describedby={hintId}
          data-form-field-type="time"
        />
      </div>
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

function isValidTime(value: any) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value)) {
    return false;
  }
  const [hours, minutes, seconds] = value.split(':').map(Number);
  return (
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59 &&
    (seconds === undefined || (seconds >= 0 && seconds <= 59))
  );
}
