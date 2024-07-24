import { DataModels } from '@5minds/processcube_engine_sdk';

import { DynamicUiFormFieldComponent } from '../DynamicUi';
import { BooleanFormField } from './BooleanFormField';
import { CheckboxFormField } from './CheckboxFormField';
import { ColorFormField } from './ColorFormField';
import { ConfirmFormField } from './ConfirmFormField';
import { DateFormField } from './DateFormField';
import { DatetimeLocalFormField } from './DatetimeLocalFormField';
import { DecimalFormField } from './DecimalFormField';
import { EmailFormField } from './EmailFormField';
import { EnumFormField } from './EnumFormField';
import { FileFormField } from './FileFormField';
import { HeaderFormField } from './HeaderFormField';
import { HiddenFormField } from './HiddenFormField';
import { IntegerFormField } from './IntegerFormField';
import { MonthFormField } from './MonthFormField';
import { NumberFormField } from './NumberFormField';
import { ParagraphFormField } from './ParagraphFormField';
import { PasswordFormField } from './PasswordFormField';
import { RadioFormField } from './RadioFormField';
import { RangeFormField } from './RangeFormField';
import { SelectFormField } from './SelectFormField';
import { StringFormField } from './StringFormField';
import { TelFormField } from './TelFormField';
import { TextareaFormField } from './TextareaFormField';
import { TimeFormField } from './TimeFormField';
import { UrlFormField } from './UrlFormField';
import { WeekFormField } from './WeekFormField';

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
  checkbox: CheckboxFormField,
  color: ColorFormField,
  date: DateFormField,
  email: EmailFormField,
  enum: EnumFormField,
  file: FileFormField,
  hidden: HiddenFormField,
  // longs are full numbers
  long: IntegerFormField,
  'datetime-local': DatetimeLocalFormField,
  month: MonthFormField,
  num: NumberFormField,
  // numbers can be decimals
  number: DecimalFormField,
  string: StringFormField,
  paragraph: ParagraphFormField,
  password: PasswordFormField,
  radio: RadioFormField,
  range: RangeFormField,
  select: SelectFormField,
  header: HeaderFormField,
  confirm: ConfirmFormField,
  tel: TelFormField,
  textarea: TextareaFormField,
  time: TimeFormField,
  url: UrlFormField,
  week: WeekFormField,
};
export { BooleanFormField } from './BooleanFormField';
export { CheckboxFormField } from './CheckboxFormField';
export { ColorFormField } from './ColorFormField';
export { DateFormField } from './DateFormField';
export { DecimalFormField } from './DecimalFormField';
export { EmailFormField } from './EmailFormField';
export { EnumFormField } from './EnumFormField';
export { HiddenFormField } from './HiddenFormField';
export { FileFormField } from './FileFormField';
export { IntegerFormField } from './IntegerFormField';
export { DatetimeLocalFormField } from './DatetimeLocalFormField';
export { MonthFormField } from './MonthFormField';
export { NumberFormField } from './NumberFormField';
export { StringFormField } from './StringFormField';
export { ParagraphFormField } from './ParagraphFormField';
export { PasswordFormField } from './PasswordFormField';
export { RadioFormField } from './RadioFormField';
export { RangeFormField } from './RangeFormField';
export { SelectFormField } from './SelectFormField';
export { HeaderFormField } from './HeaderFormField';
export { ConfirmFormField } from './ConfirmFormField';
export { TelFormField } from './TelFormField';
export { TextareaFormField } from './TextareaFormField';
export { TimeFormField } from './TimeFormField';
export { UrlFormField } from './UrlFormField';
export { WeekFormField } from './WeekFormField';
