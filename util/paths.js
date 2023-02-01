import { join } from 'path';
import config from '../load-config';

export function getPathForUserFile(fileId) {
  return join(config.userFiles, `file-${fileId}.blob`);
}

export function getPathForGroupFile(groupId) {
  return join(config.userFiles, `group-${groupId}.sqlite`);
}
