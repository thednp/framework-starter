import { signal, createElement } from "./framework";

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// global state who cares
const [count, setCount] = signal(0);
const [f, setF] = signal(count())
const doubleCount = () => {
  const currentCount = count();
  const result = currentCount * 2;
  if (currentCount >= 15) {
    console.warn("Your potato cannot process fibonaci!", f());
    // return currentCount * 2;
  } else {
    setF(fibonacci(result));
  }
  return result;
};

// const doubleCount = () => count() * 2;

export function Counter() {
  const button1 = createElement("button",
    { class: "my-button-1", 'data-count': count, onclick: () => setCount(count() + 1) },
    () => `Count is ${count()}`
  );
  const button2 = createElement("button",
    { class: "my-button-2", 'data-doublecount': doubleCount, onclick: () => setCount(count() + 1) },
    `Double count is `, doubleCount
  );

  return [button1, button2];
}
