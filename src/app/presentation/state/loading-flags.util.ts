import { signal, WritableSignal } from '@angular/core';

/**
 * Nhóm các cờ loading boolean của một slice state vào một chỗ.
 */
export class LoadingFlags {
  private readonly _flags = new Map<string, WritableSignal<boolean>>();

  /** Tạo một cờ loading và giữ tham chiếu để reset tập trung về sau. */
  create(key: string): WritableSignal<boolean> {
    const flag = signal(false);
    this._flags.set(key, flag);
    return flag;
  }

  resetAll(): void {
    for (const flag of this._flags.values()) {
      flag.set(false);
    }
  }
}
