import { defineCommand } from "citty";

export const helloCommand = defineCommand({
  meta: {
    name: "hello",
    description: "Greet a name",
  },
  args: {
    name: {
      type: "positional",
      description: "Name to greet",
      default: "world",
    },
  },
  run({ args }) {
    console.log(`Hello from Bun ${Bun.version}, ${args.name}!`);
  },
});
