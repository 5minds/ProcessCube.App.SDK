import React from 'react';

import type { DataModels } from '@5minds/processcube_engine_sdk';

import { DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function DecimalFormField(
  props: { formField: DataModels.FlowNodeInstances.UserTaskFormField },
  ref: DynamicUiFormFieldRef,
) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={formField.id}>
        {formField.label}
      </label>
      <div className="mt-1">
        <input
          className="dark:bg-dynamicui-gray-350 dark:focus:shadow-dynamicui-dark dark:invalid:shadow-dynamicui-dark-invalid block w-full rounded-md border-[color:var(--uic-border-color)] shadow-sm invalid:border-red-500 invalid:ring-1 invalid:ring-red-500 focus:border-[color:var(--uic-focus-color)] focus:ring-[color:var(--uic-focus-color)] sm:text-sm dark:border-solid dark:border-transparent dark:placeholder-gray-400 dark:invalid:border-[#dc35467f] dark:invalid:ring-[#dc35467f] dark:focus:border-[#007bff40] dark:focus:ring-[#007bff40]"
          type="number"
          step="0.01"
          placeholder={parsedCustomFormConfig?.placeholder || '0.00'}
          value={formField.defaultValue?.toString()}
          id={formField.id}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="decimal"
        />
      </div>
      {parsedCustomFormConfig?.hint && (
        <p className="dark:text-dynamicui-gray-200 mt-2 text-sm text-gray-500" id={hintId}>
          {parsedCustomFormConfig?.hint}
        </p>
      )}
    </div>
  );
}
