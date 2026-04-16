import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextAppEslintConfig } from "@repo/eslint-config/next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseConfig = createNextAppEslintConfig(__dirname);

export default [
  ...baseConfig,
  {
    files: ["**/*.{tsx,jsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message: "opslens-web에서는 raw <button> 대신 @repo/ui의 <Button>을 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message: "opslens-web에서는 raw <input> 대신 @repo/ui의 <Input>을 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "opslens-web에서는 raw <select> 대신 @repo/ui의 <Select>를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: "opslens-web에서는 raw <textarea> 대신 @repo/ui의 <Textarea>를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='label']",
          message: "opslens-web에서는 raw <label> 대신 @repo/ui의 <Label>을 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='div']",
          message: "opslens-web에서는 raw <div> 대신 @repo/ui의 <Box> 또는 <Flex>를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='header']",
          message: "opslens-web에서는 raw <header> 대신 @repo/ui의 <Box as=\"header\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='main']",
          message: "opslens-web에서는 raw <main> 대신 @repo/ui의 <Box as=\"main\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='section']",
          message: "opslens-web에서는 raw <section> 대신 @repo/ui의 <Box as=\"section\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='aside']",
          message: "opslens-web에서는 raw <aside> 대신 @repo/ui의 <Box as=\"aside\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='nav']",
          message: "opslens-web에서는 raw <nav> 대신 @repo/ui의 <Box as=\"nav\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='span']",
          message: "opslens-web에서는 raw <span> 대신 @repo/ui의 <Box as=\"span\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='p']",
          message: "opslens-web에서는 raw <p> 대신 @repo/ui의 <Typography as=\"p\"> 또는 <Box as=\"p\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='h1']",
          message: "opslens-web에서는 raw <h1> 대신 @repo/ui의 <Typography as=\"h1\"> 또는 <Box as=\"h1\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='h2']",
          message: "opslens-web에서는 raw <h2> 대신 @repo/ui의 <Typography as=\"h2\"> 또는 <Box as=\"h2\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='h3']",
          message: "opslens-web에서는 raw <h3> 대신 @repo/ui의 <Typography as=\"h3\"> 또는 <Box as=\"h3\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='h4']",
          message: "opslens-web에서는 raw <h4> 대신 @repo/ui의 <Typography as=\"h4\"> 또는 <Box as=\"h4\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='h5']",
          message: "opslens-web에서는 raw <h5> 대신 @repo/ui의 <Typography as=\"h5\"> 또는 <Box as=\"h5\">를 사용하세요."
        },
        {
          selector: "JSXOpeningElement[name.name='h6']",
          message: "opslens-web에서는 raw <h6> 대신 @repo/ui의 <Typography as=\"h6\"> 또는 <Box as=\"h6\">를 사용하세요."
        }
      ]
    }
  }
];
