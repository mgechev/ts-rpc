export const getCacheKey = (className: string, propName: string, args: any[]) => {
  return `${className}#${propName}#${JSON.stringify(args)}`;
};
