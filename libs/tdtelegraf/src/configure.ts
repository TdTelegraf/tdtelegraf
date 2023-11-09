import { getTdjson } from 'prebuilt-tdlib';
import { configure as tdlConfigure, TDLibConfiguration } from 'tdl';

export const configure = ({ tdjson = null, ...options }: TDLibConfiguration = {}) => {
  // eslint-disable-next-line no-param-reassign
  if (!tdjson) tdjson = getTdjson();
  tdlConfigure({
    tdjson,
    ...options,
  });
};
