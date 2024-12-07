import { Writable } from 'stream';
import { parse } from 'csv-parse';
import { createCsvTransformer } from '../csv-transformer.ts';

export interface CsvProcessorOptions {
  delimiter?: string;
  skipHeader?: boolean;
  encoding?: BufferEncoding;
  batchSize: number;
}

export abstract class BaseCsvStreamProcessor<T extends new () => InstanceType<T>> {
  protected options: CsvProcessorOptions;
  protected type: T;

  constructor(type: T, options: CsvProcessorOptions) {
    this.type = type;
    this.options = options;
  }

  protected createParser() {
    return parse({
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      trim: true,
      skipHeader: false,
      encoding: 'utf-8',
      ...this.options,
    });
  }

  protected createTransformer() {
    return createCsvTransformer({
      batchSize: this.options.batchSize,
      type: this.type,
    });
  }

  protected setupPipeline(
    csvParser: ReturnType<typeof parse>,
    writable: Writable,
    onComplete: (error?: Error) => void
  ) {
    let isCompleted = false;
    const csvTransformer = this.createTransformer();

    const completeOnce = (error?: Error) => {
      if (!isCompleted) {
        isCompleted = true;
        csvParser.destroy();
        csvTransformer.destroy();
        writable.destroy();
        onComplete(error);
      }
    };

    csvParser.on('error', error => completeOnce(error));
    csvTransformer.on('error', error => completeOnce(error));
    writable.on('error', error => completeOnce(error));
    writable.on('finish', () => completeOnce());

    csvParser.pipe(csvTransformer).pipe(writable);
    return csvParser;
  }
}
