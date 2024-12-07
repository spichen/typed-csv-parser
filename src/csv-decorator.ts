import 'reflect-metadata';

export const CSV_HEADER = 'csvHeader';
export const CSV_PARSER = 'csvParser';

export type CsvHeaderOptions = {
  name: string;
  parser?: (value: string) => any;
};

export function CsvHeader(options: string | CsvHeaderOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    if (typeof options === 'string') {
      Reflect.defineMetadata(CSV_HEADER, options, target, propertyKey);
    } else {
      Reflect.defineMetadata(CSV_HEADER, options.name, target, propertyKey);
      if (options.parser) {
        Reflect.defineMetadata(CSV_PARSER, options.parser, target, propertyKey);
      }
    }
  };
}
