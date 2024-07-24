// import React from 'react';
// import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
// import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';
// export function SelectFormField(
//   { formField, state }: DynamicUiComponentProps<string | Array<string> | null>,
//   ref: DynamicUiFormFieldRef,
// ) {
//   const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);
//   const label = formField.label;
//   const options = formField.enumValues;
//   let enumInput: JSX.Element;
//   const defaultSelect = state || options?.find((option) => option.id === formField.defaultValue)?.id || '';
//   enumInput = (
//     <select
//       id={formField.id}
//       name={formField.id}
//       className="app-sdk-form-select app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-mt-1 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-py-2 app-sdk-pl-3 app-sdk-pr-10 app-sdk-text-base app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] invalid:app-sdk-border-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-1 invalid:app-sdk-ring-[color:var(--asdk-dui-formfield-invalid-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-outline-none focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:app-sdk-bg-app-sdk-dropdown-dark dark:invalid:app-sdk-shadow-app-sdk-dark-invalid dark:focus:app-sdk-shadow-app-sdk-dark"
//       onChange={(event) => (event.target.dataset.value = event.target.value)}
//       data-value={defaultSelect}
//       aria-describedby={parsedCustomFormConfig?.hint ? `${formField.id}-hint` : undefined}
//       data-form-field-type="enum"
//       defaultValue={defaultSelect}
//     >
//       <option value="">{!defaultSelect && parsedCustomFormConfig?.placeholder}</option>
//       {options?.map((option) => {
//         return (
//           <option key={option.id} value={option.id}>
//             {option.name}
//           </option>
//         );
//       })}
//     </select>
//   );
//   const hint = parsedCustomFormConfig?.hint ? (
//     <p
//       id={`${formField.id}-hint`}
//       className="app-sdk-mt-2 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
//     >
//       {parsedCustomFormConfig.hint}
//     </p>
//   ) : null;
//   return (
//     <div>
//       <label className="app-sdk-block app-sdk-text-sm app-sdk-font-medium" htmlFor={formField.id}>
//         {label}
//       </label>
//       {enumInput}
//       {hint}
//     </div>
//   );
// }
import React from 'react';

import { DynamicUiComponentProps, DynamicUiFormFieldRef } from '../DynamicUi';
import { parseCustomFormConfig } from '../utils/parseCustomFormConfig';

export function SelectFormField(props: DynamicUiComponentProps<boolean>, ref: DynamicUiFormFieldRef) {
  const { formField } = props;
  const hintId = `${formField.id}-hint`;
  const parsedCustomFormConfig = parseCustomFormConfig(formField.customForm);

  return (
    <div className="app-sdk-mt-4">
      <div className="app-sdk-flex app-sdk-items-start">
        <div className="app-sdk-flex app-sdk-h-5 app-sdk-items-center">
          <input
            className="app-sdk-form-select app-sdk-text-app-sdk-inherit app-sdk-border app-sdk-mt-1 app-sdk-block app-sdk-w-full app-sdk-rounded-md app-sdk-border-[color:var(--asdk-dui-border-color)] app-sdk-bg-[color:var(--asdk-dui-formfield-background-color)] app-sdk-py-2 app-sdk-pl-3 app-sdk-pr-10 app-sdk-text-base app-sdk-placeholder-[color:var(--asdk-dui-formfield-placeholder-text-color)] invalid:app-sdk-border-[color:var(--asdk-dui-formfield-invalid-color)] invalid:app-sdk-ring-1 invalid:app-sdk-ring-[color:var(--asdk-dui-formfield-invalid-color)] focus:app-sdk-border-[color:var(--asdk-dui-focus-color)] focus:app-sdk-outline-none focus:app-sdk-ring-[color:var(--asdk-dui-focus-color)] sm:app-sdk-text-sm dark:app-sdk-border-solid dark:app-sdk-border-transparent dark:app-sdk-bg-app-sdk-dropdown-dark dark:invalid:app-sdk-shadow-app-sdk-dark-invalid dark:focus:app-sdk-shadow-app-sdk-dark"
            type="select"
            id={formField.id}
            name={formField.id}
            aria-describedby={hintId}
            data-form-field-type="select"
          />
        </div>
        <div className="app-sdk-ml-3 app-sdk-text-sm">
          <label className="app-sdk-font-medium" htmlFor={formField.id}>
            {formField.label}
          </label>
          {parsedCustomFormConfig?.hint && (
            <p
              className="app-sdk-mt-1 app-sdk-text-sm app-sdk-text-[color:var(--asdk-dui-formfield-hint-text-color)]"
              id={hintId}
            >
              {parsedCustomFormConfig?.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
