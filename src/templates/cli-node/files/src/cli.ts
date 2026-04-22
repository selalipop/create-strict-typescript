#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { helloCommand } from "./commands/hello.ts";

const main = defineCommand({
  meta: {
    name: "{{name}}",
    version: "0.0.0",
    description: "A strict TypeScript CLI",
  },
  subCommands: {
    hello: helloCommand,
  },
});

void runMain(main);
