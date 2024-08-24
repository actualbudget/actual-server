function isKebabCase(str: string): boolean {
  return /^[a-z]+(-[a-z]+)+$/.test(str);
}

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
}

function transformKeys(obj: object): object {
  const newObj: object = {};
  for (const key in obj) {
    const newKey = isKebabCase(key) ? kebabToCamel(key) : key;
    newObj[newKey] = obj[key];
  }
  return newObj;
}

export { transformKeys };
