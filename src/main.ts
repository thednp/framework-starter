import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { Counter } from './counter.ts'
import { createElement, add } from './framework'


function App() {
  const ViteLink = createElement("a",
    { href: "https://vite.dev", target: "_blank" },
    createElement("img", { src: viteLogo, class: "logo vanilla", alt: "TypeScript logo" })
  )
  const TypeScriptLink = createElement("a",
    { href: "https://www.typescriptlang.org/", target: "_blank", onmouseenter: () => console.log("hi!") },
    createElement("img", { src: typescriptLogo, class: "logo vanilla", alt: "TypeScript logo" })
  )
  
  const h1 = createElement("h1",
    "Vite + Typescript"
  );


  return createElement('div',
    ViteLink, TypeScriptLink, h1,
    Counter(),
  );
}

add(document.getElementById("app")!, App());
