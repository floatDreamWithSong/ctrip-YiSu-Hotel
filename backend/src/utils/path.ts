export interface UploadOptions {
  prefix: string,
  serviceType?: string,
  fileName?: string,
  ext?: string,
}

export const joinPath = (...paths: string[]): string => {
  return paths.filter(Boolean).join('/');
}
export const buildStorageKey = (data: UploadOptions): string => {
  let serviceId = crypto.randomUUID().substring(0, 8);
  if (data.fileName) {
    serviceId = `${serviceId}-${data.fileName}`;
  }
  if (data.ext) {
    if (!data.ext.startsWith('.'))
      data.ext = `.${data.ext}`;
    serviceId = `${serviceId}${data.ext}`;
  }
  return joinPath(data.prefix, data.serviceType, serviceId);
}