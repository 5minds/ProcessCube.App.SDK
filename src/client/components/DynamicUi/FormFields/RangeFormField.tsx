import React, { useState } from 'react';

import { classNames } from '../../../utils/classNames';
import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function RangeFormField(
  { formField, state }: DynamicUiComponentProps<number | null>,
  ref: DynamicUiFormFieldRef,
) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  const label = formField.label;

  const defaultMin = parsedCustomFormConfig?.min || 0;
  const defaultMax = parsedCustomFormConfig?.max || 100;
  const defaultStep = parsedCustomFormConfig?.step || 1;

  const defaultValue = state || formField.defaultValue?.toString() || defaultMin.toString();
  const [currentValue, setCurrentValue] = useState(defaultValue);

  const handleChange = (event) => {
    setCurrentValue(event.target.value);
  };

  const rangeInput = (
    <input
      className={classNames(
        'app-sdk-form-input app-sdk-block app-sdk-w-full app-sdk-appearance-auto app-sdk-px-0 app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] focus:app-sdk-ring-transparent focus:app-sdk-border-transparent',
      )}
      id={formField.id}
      name={formField.id}
      type="range"
      min={defaultMin.toString()}
      max={defaultMax.toString()}
      step={defaultStep.toString()}
      defaultValue={defaultValue}
      value={currentValue}
      onChange={handleChange}
      aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
      data-form-field-type="range"
    />
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
      <div className="app-sdk-mt-1">
        <span className="app-sdk-text-sm app-sdk-text-gray-700">{defaultMin}</span>
        {rangeInput}
        <span className="app-sdk-text-sm app-sdk-text-gray-700">{defaultMax}</span>
      </div>
      <div className="app-sdk-mt-1 app-sdk-text-sm app-sdk-text-gray-600">Aktueller Wert: {currentValue}</div>
      {hint}
    </div>
  );
}
