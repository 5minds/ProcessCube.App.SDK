const warnedComponents = new Set<string>();

export function warnOnceForDeprecation(componentName: string, subtext?: string): void {
  if (!warnedComponents.has(componentName)) {
    console.warn(
      `[@5minds/processcube_app_sdk]\t\tWarning: The component "${componentName}" is deprecated.\n\n${subtext ?? ''}`.trimEnd(),
    );
    warnedComponents.add(componentName);
  }
}
