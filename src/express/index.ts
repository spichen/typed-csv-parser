import 'reflect-metadata';
import { Request } from 'express';
import { Writable } from 'stream';
import formidable, { Files } from 'formidable';
import { BaseCsvStreamProcessor, CsvProcessorOptions } from '../core/base-processor.ts';

export class ExpressCsvStreamProcessor<
  T extends new () => InstanceType<T>
> extends BaseCsvStreamProcessor<T> {
  constructor(type: T, options: CsvProcessorOptions) {
    super(type, options);
  }

  processRequest = (
    request: Request,
    writable: Writable,
    onComplete: (error?: Error) => void
  ): void => {
    const csvParser = this.createParser();
    let isCompleted = false;

    const completeOnce = (error?: Error) => {
      if (!isCompleted) {
        isCompleted = true;
        onComplete(error);
      }
    };

    const pipeline = this.setupPipeline(csvParser, writable, completeOnce);

    const form = formidable({
      fileWriteStreamHandler: () => pipeline,
    });

    form.parse(request, (err, _, files: Files) => {
      if (err) {
        completeOnce(err);
        return;
      }

      const fileFields = Object.values(files);
      if (!fileFields.length) {
        completeOnce(new Error('No file uploaded'));
        return;
      }

      const file = Array.isArray(fileFields[0]) ? fileFields[0][0] : fileFields[0];
      const validMimeTypes = ['text/csv', 'application/csv'];
      if (!file?.mimetype || !validMimeTypes.includes(file.mimetype)) {
        completeOnce(new Error('Invalid file type. Only CSV files are allowed.'));
        return;
      }
    });
  };
}

export default ExpressCsvStreamProcessor;
