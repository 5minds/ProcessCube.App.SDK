import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function HeaderFormField({ formField }: DynamicUiComponentProps, ref: DynamicUiFormFieldRef) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  let headerElement: JSX.Element;

  switch (parsedCustomFormConfig?.style) {
    case 'heading_1':
      headerElement = (
        <h1 className="text-2xl font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h1>
      );
      break;
    case 'heading_2':
      headerElement = (
        <h2 className="text-xl font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h2>
      );
      break;
    case 'heading_3':
      headerElement = (
        <h3 className="text-lg font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h3>
      );
      break;
    default:
      headerElement = (
        <h1 className="text-2xl font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h1>
      );
      break;
  }

  return <div className="header-form-field">{headerElement}</div>;
}
