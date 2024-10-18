export function parseCustomFormConfig(customFormConfig?: string): Record<string, any> | null {
  if (customFormConfig != null && customFormConfig.trim() !== '') {
    try {
      const parsedConfig = JSON.parse(customFormConfig);
      return parsedConfig;
    } catch (error) {
      return null;
    }
  }

  return null;
}
