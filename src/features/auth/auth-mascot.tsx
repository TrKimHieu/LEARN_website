'use client';

import { Mascot, useIsPhone } from '@/components/shared/mascot';

/** Mascot của màn xác thực: nhỏ ở dải trên điện thoại, lớn ở cột phải website. */
export function AuthMascot() {
  const isPhone = useIsPhone();
  return <Mascot state="happy" size={isPhone ? 64 : 120} surface="color" priority="companion" />;
}
