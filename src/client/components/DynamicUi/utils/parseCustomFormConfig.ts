export function parseCustomFormConfig(customFormConfig?: string): Record<string, string> | null {
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
