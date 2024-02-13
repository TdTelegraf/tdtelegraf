import { mkdir, writeFile } from 'node:fs/promises';

import { isDev } from '@lsk4/env';

export const saveMock = async (name: string, data: any) => {
  if (isDev) {
    const dirname = `${process.cwd()}/__tdlib_mocks`;
    await mkdir(dirname, { recursive: true });
    await writeFile(`${dirname}/${name}`, JSON.stringify(data, null, 2));
  }
};
