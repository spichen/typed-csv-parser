import 'reflect-metadata';

import { Transform } from 'stream';
import { CSV_HEADER, CSV_PARSER, CSV_FIELDS } from './csv-decorator.ts';

const recordToEntityMap = <T extends new () => any>(
  record: Record<string, string>,
  type: T
): InstanceType<T> | undefined => {
  try {
    const instance = new type();
    const properties = Reflect.getMetadata(CSV_FIELDS, type.prototype);

    for (const property of properties) {
      const csvHeader = Reflect.getMetadata(CSV_HEADER, type.prototype, property);
      if (csvHeader && record[csvHeader] !== undefined) {
        const value = record[csvHeader];

        const customParser = Reflect.getMetadata(CSV_PARSER, type.prototype, property);
        if (customParser) {
          instance[property] = customParser(value);
          continue;
        }

        const propertyType = Reflect.getMetadata('design:type', type.prototype, property);

        if (propertyType === Number) {
          instance[property] = Number(value);
        } else if (propertyType === Boolean) {
          instance[property] = value.toLowerCase() === 'true';
        } else if (propertyType === Date) {
          instance[property] = new Date(value);
        } else {
          instance[property] = value;
        }
      }
    }

    return instance;
  } catch (err) {
    console.error(err);
  }
};

interface CsvTransformerOptions<T extends new () => any> {
  batchSize?: number;
  type: T;
}

export const createCsvTransformer = <T extends new () => any>({
  batchSize = 3000,
  type,
}: CsvTransformerOptions<T>) => {
  let batch: InstanceType<T>[] = [];
  return new Transform({
    objectMode: true,
    transform(record, encoding, callback) {
      try {
        const transformedRecord = recordToEntityMap(record, type);
        if (transformedRecord) {
          batch.push(transformedRecord);

          if (batch.length >= batchSize) {
            this.push(batch);
            batch = [];
          }
        }
        callback();
      } catch (error) {
        if (error instanceof Error) {
          this.destroy(error);
        } else {
          this.destroy(new Error('Unknown error occurred during transformation'));
        }
      }
    },
    flush(callback) {
      if (batch.length > 0) {
        this.push(batch);
        batch = [];
      }
      callback();
    },
  });
};
