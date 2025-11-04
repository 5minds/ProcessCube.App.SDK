import React, { forwardRef } from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';

export const ConfirmFormField = forwardRef(function ConfirmFormField(props: DynamicUiComponentProps, ref: DynamicUiFormFieldRef) {
  return <p className="app-sdk-text-sm">{props.formField.label}</p>;
});
