import { throttle } from 'lodash';
import { useMemo } from 'react';

export function useWriteValue(characteristics: Record<string, BluetoothRemoteGATTCharacteristic | null>) {
  return useMemo(() => {
    const debouncers: Record<string, (v: BufferSource) => void> = {};

    return (type: string, value: BufferSource) => {
      if (!debouncers[type]) {
        const fun = throttle((v: BufferSource) => characteristics[type]?.writeValue(v), 500);
        debouncers[type] = fun;
      }
      debouncers[type](value);
    };
  }, [characteristics]);
}
