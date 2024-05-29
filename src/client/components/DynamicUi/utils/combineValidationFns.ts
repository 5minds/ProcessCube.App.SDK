import { ClientValidationFn, ServerValidationFn } from '../DynamicUi';

export function combineSubmitValidationFns(...validationFns: ServerValidationFn[]) {
  return async (formData: FormData): Promise<string[]> => {
    const validationPromises = validationFns.map((fn) => fn(formData));
    const validationErrors = await Promise.all(validationPromises);

    return validationErrors.filter((error) => error !== null) as string[];
  };
}

export function combineChangeValidationFns(...validationFns: ClientValidationFn[]) {
  return async (id: string, type: string, value: any): Promise<string[]> => {
    const validationPromises = validationFns.map((fn) => fn(id, type, value));
    const validationErrors = await Promise.all(validationPromises);

    return validationErrors.filter((error) => error !== null) as string[];
  };
}
