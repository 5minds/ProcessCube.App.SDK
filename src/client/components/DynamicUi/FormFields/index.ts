import { DataModels } from '@5minds/processcube_engine_sdk';

import { DynamicUiFormFieldComponent } from '../DynamicUi';
import { BooleanFormField } from './BooleanFormField';
import { ConfirmFormField } from './ConfirmFormField';
import { DateFormField } from './DateFormField';
import { DecimalFormField } from './DecimalFormField';
import { EnumFormField } from './EnumFormField';
import { HeaderFormField } from './HeaderFormField';
import { IntegerFormField } from './IntegerFormField';
import { ParagraphFormField } from './ParagraphFormField';
import { StringFormField } from './StringFormField';

enum MissingFormFieldType {
  paragraph = 'paragraph',
  header = 'header',
  confirm = 'confirm',
}

const UserTaskFormFieldType = {
  ...DataModels.FlowNodeInstances.UserTaskFormFieldType,
  ...MissingFormFieldType,
};

type CommonFormFieldTypeComponentMap = {
  [TFormFieldType in keyof typeof UserTaskFormFieldType]: DynamicUiFormFieldComponent;
};

export type GenericFormFieldTypeComponentMap = {
  [type: string]: DynamicUiFormFieldComponent;
};

export type DynamicUiFormFieldComponentMap = CommonFormFieldTypeComponentMap | GenericFormFieldTypeComponentMap;

export const FormFieldComponentMap: DynamicUiFormFieldComponentMap = {
  boolean: BooleanFormField,
  date: DateFormField,
  enum: EnumFormField,
  // longs are full numbers
  long: IntegerFormField,
  // numbers can be decimals
  number: DecimalFormField,
  string: StringFormField,
  paragraph: ParagraphFormField,
  header: HeaderFormField,
  confirm: ConfirmFormField,
};
export { BooleanFormField } from './BooleanFormField';
export { DateFormField } from './DateFormField';
export { DecimalFormField } from './DecimalFormField';
export { EnumFormField } from './EnumFormField';
export { IntegerFormField } from './IntegerFormField';
export { StringFormField } from './StringFormField';
export { ParagraphFormField } from './ParagraphFormField';
export { HeaderFormField } from './HeaderFormField';
export { ConfirmFormField } from './ConfirmFormField';
