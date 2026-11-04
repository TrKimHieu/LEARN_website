import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { refreshCourseData, refreshUsage } from './query-refresh';

const seed = (keys: string[][]) => {
  const client = new QueryClient();
  keys.forEach((key) => client.setQueryData(key, 'old'));
  return client;
};
const isStale = (client: QueryClient, key: string[]) =>
  client.getQueryState(key)?.isInvalidated === true;

describe('refreshCourseData', () => {
  it('làm mới danh sách, chi tiết, tài liệu, bài học, tổng quan và hạn mức', async () => {
    const stale = [
      ['courses'],
      ['courses', 'c1'],
      ['courses', 'c1', 'documents'],
      ['courses', 'c1', 'lessons'],
      ['progress', 'overview'],
      ['progress', 'courses'],
      ['subscription'],
    ];
    const client = seed([...stale, ['plans']]);
    await refreshCourseData(client);
    stale.forEach((key) => expect(isStale(client, key), key.join('/')).toBe(true));
    expect(isStale(client, ['plans'])).toBe(false);
  });
});

describe('refreshUsage', () => {
  it('chỉ làm mới hạn mức', async () => {
    const client = seed([['subscription'], ['courses']]);
    await refreshUsage(client);
    expect(isStale(client, ['subscription'])).toBe(true);
    expect(isStale(client, ['courses'])).toBe(false);
  });
});
