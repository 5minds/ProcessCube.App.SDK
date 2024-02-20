import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function HeaderFormField({ formField }: DynamicUiComponentProps, ref: DynamicUiFormFieldRef) {
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  let headerElement: JSX.Element;

  switch (parsedCustomFormConfig?.style) {
    case 'heading_1':
      headerElement = (
        <h1 className="dynamic-ui-text-2xl dynamic-ui-font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h1>
      );
      break;
    case 'heading_2':
      headerElement = (
        <h2 className="dynamic-ui-text-xl dynamic-ui-font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h2>
      );
      break;
    case 'heading_3':
      headerElement = (
        <h3 className="dynamic-ui-text-lg dynamic-ui-font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h3>
      );
      break;
    default:
      headerElement = (
        <h1 className="dynamic-ui-text-2xl dynamic-ui-font-bold">{formField.defaultValue?.toString() || formField.label?.toString()}</h1>
      );
      break;
  }

  return <div className="dynamic-ui-header-form-field">{headerElement}</div>;
}
