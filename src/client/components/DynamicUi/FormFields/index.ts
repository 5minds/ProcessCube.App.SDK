import { DataModels } from '@5minds/processcube_engine_sdk';
import { DynamicUiFormFieldComponent } from '../DynamicUi';
import { BooleanFormField } from './BooleanFormField';
import { DateFormField } from './DateFormField';
import { DecimalFormField } from './DecimalFormField';
import { EnumFormField } from './EnumFormField';
import { IntegerFormField } from './IntegerFormField';
import { StringFormField } from './StringFormField';
import { ParagraphFormField } from './ParagraphFormField';
import { HeaderFormField } from './HeaderFormField';
import { ConfirmFormField } from './ConfirmFormField';

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
