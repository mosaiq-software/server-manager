/** @type {import('prettier').Config} */
const PrettierConfig = {
    plugins: ['prettier-plugin-organize-imports'],
    trailingComma: 'es5',
    bracketSpacing: true,
    objectWrap: 'preserve',
    singleQuote: true,
    semi: true,
    tabWidth: 4,
    useTabs: false,
    endOfLine: 'auto',
    singleAttributePerLine: true,
    printWidth: 999999,
};

export default PrettierConfig;
