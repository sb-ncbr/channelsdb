/**
 * Copyright (c) 2024 channelsdb contributors, licensed under Apache 2.0, See LICENSE file for more info.
 *
 * @author Dušan Veľký <dvelky@mail.muni.cz>
 */
export class SimpleObservable {
    constructor(private watcher: () => any, private onChange: (value: any) => void) {}
  
    subscribe() {
      let currentValue = this.watcher();
      if (currentValue !== void 0) {
        this.onChange(currentValue);
      } else {
        const intervalId = setInterval(() => {
          const newValue = this.watcher();
          if (newValue !== void 0) {
            clearInterval(intervalId);
            this.onChange(newValue);
          }
        }, 100);
      }
    }
}