import { continueRender, delayRender, staticFile } from "remotion";

const load = (weight: string, file: string) =>
  new FontFace("Satoshi", `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight })
    .load()
    .then((f) => document.fonts.add(f));

const handle = delayRender("fonts");
Promise.all([
  load("500", "Satoshi-500.woff2"),
  load("700", "Satoshi-700.woff2"),
  load("900", "Satoshi-900.woff2"),
]).then(() => continueRender(handle));
