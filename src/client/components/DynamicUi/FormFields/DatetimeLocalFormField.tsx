import React from 'react';

import { DynamicUiComponentProps } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function DatetimeLocalFormField(props: DynamicUiComponentProps<string | null>) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  if (formField.defaultValue && !isValidDateTimeLocal(formField.defaultValue.toString())) {
    console.warn(
      `[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for dateteime-local field "${formField.id}"`,
    );
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
          type="datetime-local"
          defaultValue={defaultValue}
          id={formField.id}
          name={formField.id}
          placeholder={parsedCustomFormConfig?.placeholder || 'yyyy-mm-ddThh:mm:ss'}
          aria-describedby={hintId}
          data-form-field-type="datetime-local"
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

function isValidDate(value: string) {
  return new Date(value?.toString()).toString() !== 'Invalid Date';
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value);
}

function isValidDateTimeLocal(value: string) {
  if (!value.includes('T')) {
    return false;
  }

  const [date, time] = value.split('T');
  return isValidDate(date) && isValidTime(time);
}
