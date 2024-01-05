import React from 'react';

import type { DataModels } from '@5minds/processcube_engine_sdk';

import { DynamicUiFormFieldRef } from '../DynamicUi';

export function ConfirmFormField(
  props: { formField: DataModels.FlowNodeInstances.UserTaskFormField },
  ref: DynamicUiFormFieldRef,
) {
  const { formField } = props;

  return <p className="text-sm">{formField.label}</p>;
}
