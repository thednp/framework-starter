type Observer = () => void;
export type Accessor<T> = () => T
export type Setter<T> = (val: T) => void;

let Observer: Observer | null = null;

export function signal<T>(value: T): [() => T, (v: T) => void] {
  const observers = new Set<Observer>();
  return [
    () => {
      if (Observer) {
        observers.add(Observer);
      }
      return value;
    },
    (v: T) => {
      value = v;
      for (let o of observers) {
        o();
      }
    },
  ];
}

export function effect<T>(fn: () => T | void) {
  let compute: Observer;
  let cleanup: (() => void) | void;
  
  compute = () => {
    try {
      if (cleanup) cleanup(); // Run previous cleanup
      Observer = compute;
      cleanup = fn() as (() => void); // Store new cleanup
    } finally {
      Observer = null;
    }
  };
  compute();
  
  return () => {
    if (cleanup) cleanup();
    compute = () => {};
  };
}
