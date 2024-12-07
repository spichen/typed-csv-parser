import 'reflect-metadata';
export const CSV_HEADER = 'csvHeader';
export const CSV_PARSER = 'csvParser';
export const CSV_FIELDS = 'csvFields';

export type CsvHeaderOptions = {
  name: string;
  parser?: (value: string) => any;
};

export function CsvHeader(options: string | CsvHeaderOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(CSV_HEADER, options, target, propertyKey);
    if (typeof options === 'string') {
      Reflect.defineMetadata(CSV_HEADER, options, target, propertyKey);
    } else {
      Reflect.defineMetadata(CSV_HEADER, options.name, target, propertyKey);
      if (options.parser) {
        Reflect.defineMetadata(CSV_PARSER, options.parser, target, propertyKey);
      }
    }

    let csvFields = Reflect.getOwnMetadata(CSV_FIELDS, target);
    if (!csvFields) {
      csvFields = Reflect.hasMetadata(CSV_HEADER, target)
        ? Reflect.getMetadata(CSV_HEADER, target).slice(0)
        : [];

      Reflect.defineMetadata(CSV_FIELDS, csvFields, target);
    }

    csvFields.push(propertyKey);
  };
}
