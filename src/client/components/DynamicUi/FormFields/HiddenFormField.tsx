import React from 'react';

import { DynamicUiComponentProps } from '../DynamicUi';

export function HiddenFormField(props: DynamicUiComponentProps<string | null>) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;

  return (
    <div>
      <div className="app-sdk-mt-1">
        <input
          className="app-sdk-hidden"
          type="hidden"
          id={formField.id}
          value={props.state || formField.defaultValue?.toString() || ''}
          name={formField.id}
          aria-describedby={hintId}
          data-form-field-type="hidden"
        />
      </div>
    </div>
  );
}
