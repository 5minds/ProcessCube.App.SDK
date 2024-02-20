import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';

export function ConfirmFormField(props: DynamicUiComponentProps, ref: DynamicUiFormFieldRef) {
  return <p className="dynamic-ui-text-sm">{props.formField.label}</p>;
}
