export default async function handleExternalTask(payload: any) {
  console.log('External Task received:', payload);
  return { success: true, processedAt: new Date().toISOString() };
}
