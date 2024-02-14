export const startsWith = (str: string, searchString: string, position?: number | undefined) =>
  (str || '')?.startsWith(searchString, position);

export const last = (arr: any[]) => arr[arr.length - 1];
export const first = (arr: any[]) => arr[0];
