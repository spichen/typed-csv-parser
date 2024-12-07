import express, { type Express, type Request, type Response } from 'express';
import { Writable } from 'stream';
import { ExpressCsvStreamProcessor } from '../express/index.ts';
import * as path from 'path';
import request from 'supertest';
import { User } from './helpers/User.ts';

describe('ExpressCsvStreamProcessor', () => {
  let app: Express;
  let results: User[][];

  beforeEach(() => {
    app = express();
    results = [];

    app.post('/upload', (req: Request, res: Response) => {
      const processor = new ExpressCsvStreamProcessor(User, { batchSize: 2 });

      const writable = new Writable({
        objectMode: true,
        write(chunk: User[], encoding, callback) {
          results.push(chunk);
          callback();
        },
      });

      processor.processRequest(req, writable, error => {
        if (error) {
          res.status(400).json({ error: error.message });
        } else {
          res.json({ success: true, results });
        }
      });
    });

    app.post('/upload-custom-batch', (req: Request, res: Response) => {
      const processor = new ExpressCsvStreamProcessor(User, { batchSize: 1 });

      const writable = new Writable({
        objectMode: true,
        write(chunk: User[], encoding, callback) {
          results.push(chunk);
          callback();
        },
      });

      processor.processRequest(req, writable, error => {
        if (error) {
          res.status(400).json({ error: error.message });
        } else {
          res.json({ success: true, results });
        }
      });
    });
  });

  it('should process valid CSV file upload and transform data correctly', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('file', path.join(__dirname, 'fixtures', 'test.csv'))
      .expect(200);

    expect(response.body.success).toBe(true);
    const processedResults = response.body.results as User[][];
    expect(processedResults).toHaveLength(2);

    const firstBatch = processedResults[0];
    expect(firstBatch).toHaveLength(2);
    expect(firstBatch[0]).toEqual(
      expect.objectContaining({
        name: 'John Doe',
        age: 30,
        active: true,
      })
    );
    expect(firstBatch[1]).toEqual(
      expect.objectContaining({
        name: 'Jane Smith',
        age: 25,
        active: false,
      })
    );

    const secondBatch = processedResults[1];
    expect(secondBatch).toHaveLength(1);
    expect(secondBatch[0]).toEqual(
      expect.objectContaining({
        name: 'Bob Wilson',
        age: 45,
        active: true,
      })
    );
  });

  it('should handle custom batch size', async () => {
    const response = await request(app)
      .post('/upload-custom-batch')
      .attach('file', path.join(__dirname, 'fixtures', 'test.csv'))
      .expect(200);

    expect(response.body.success).toBe(true);
    const processedResults = response.body.results as User[][];
    expect(processedResults).toHaveLength(3);

    expect(processedResults[0]).toHaveLength(1);
    expect(processedResults[1]).toHaveLength(1);
    expect(processedResults[2]).toHaveLength(1);

    expect(processedResults[0][0]).toEqual(
      expect.objectContaining({
        name: 'John Doe',
        age: 30,
        active: true,
      })
    );
    expect(processedResults[1][0]).toEqual(
      expect.objectContaining({
        name: 'Jane Smith',
        age: 25,
        active: false,
      })
    );
    expect(processedResults[2][0]).toEqual(
      expect.objectContaining({
        name: 'Bob Wilson',
        age: 45,
        active: true,
      })
    );
  });

  it('should reject non-CSV file upload', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('file', path.join(__dirname, 'fixtures', 'test.csv'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(response.body.error).toBe('Invalid file type. Only CSV files are allowed.');
  });

  it('should handle missing file in multipart request', async () => {
    const response = await request(app).post('/upload').field('someField', 'someValue').expect(400);

    expect(response.body.error).toBe('No file uploaded');
  });
});
