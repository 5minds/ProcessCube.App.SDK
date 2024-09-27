import React from 'react';

import { DynamicUiComponentProps } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function WeekFormField(props: DynamicUiComponentProps<string | null>) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  if (!isValidWeek(formField.defaultValue)) {
    console.warn(`[@5minds/processcube_app_sdk:DynamicUi]\t\tInvalid default value for week field "${formField.id}"`);
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
          type="week"
          defaultValue={defaultValue}
          id={formField.id}
          name={formField.id}
          placeholder={parsedCustomFormConfig?.placeholder || 'yyyy-Www'}
          aria-describedby={hintId}
          data-form-field-type="week"
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

function isValidWeek(value: any) {
  if (typeof value !== 'string' || !/^(\d{4})-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(value)) {
    return false;
  }
  const [year, week] = value.split('-W');
  const firstDayOfYear = new Date(Number(year), 0, 1);
  const dayOfWeek = firstDayOfYear.getUTCDay();
  const dayOffset = dayOfWeek <= 4 ? dayOfWeek - 1 : dayOfWeek - 8;
  const weekStartDate = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() - dayOffset + (Number(week) - 1) * 7));
  return !isNaN(weekStartDate.getTime());
}
