import type { ClientValidationFn, ServerValidationFn, FormFieldTypes } from '../DynamicUi';


export type CombinedChangeValidationFn = ((id: string, type: FormFieldTypes, value: any) => Promise<Array<string>>) | undefined;
export type CombinedSubmitValidationFn = ((formData: FormData) => Promise<Array<string>>);

export function combineSubmitValidationFns(validationFns: Array<ServerValidationFn>): CombinedSubmitValidationFn {
  return async (formData: FormData): Promise<Array<string>> => {
    const validationPromises = validationFns.map((fn) => fn(formData));
    const validationErrors = await Promise.all(validationPromises);

    return validationErrors.filter((error) => error !== null) as Array<string>;
  };
}

export function combineChangeValidationFns(validationFns: Array<ClientValidationFn>): CombinedChangeValidationFn {
  return async (id: string, type: string, value: any): Promise<Array<string>> => {
    const validationPromises = validationFns.map((fn) => fn(id, type, value));
    const validationErrors = await Promise.all(validationPromises);

    return validationErrors.filter((error) => error !== null) as Array<string>;
  };
}
