import React from 'react';

import { DynamicUiComponentProps } from '../DynamicUi';

export function HiddenFormField(props: DynamicUiComponentProps<string | null>) {
  const { formField } = props;

  return <input className="app-sdk-hidden" type="hidden" id={formField.id} value={formField.defaultValue?.toString() || ''} name={formField.id} data-form-field-type="hidden" />;
}
