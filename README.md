# Typed CSV Stream Parser

A strongly-typed CSV stream processor for Node.js that transforms CSV data into TypeScript classes with automatic type conversion and validation.

## Features

- 🔑 **Type-safe**: Transform CSV data into strongly-typed TypeScript classes
- 🚀 **Streaming**: Process large CSV files efficiently using Node.js streams
- 🎯 **Automatic Type Conversion**: Built-in conversion for common types (Number, Boolean, Date)
- 🛠 **Custom Parsers**: Define custom parsing logic for complex data types
- 📦 **Batch Processing**: Process records in configurable batch sizes for optimal performance
- 🔌 **Express Integration**: Ready-to-use processor for handling CSV file uploads in Express applications

## Installation

```bash
npm install typed-csv-stream
```

## Usage

### 1. Define Your Data Model

Use decorators to map CSV columns to class properties:

```typescript
import { CsvHeader } from 'typed-csv-stream';

class User {
  @CsvHeader('name')
  name: string;

  @CsvHeader('age')
  age: number;

  @CsvHeader('isActive')
  active: boolean;

  @CsvHeader({
    name: 'joinDate',
    parser: (value: string) => new Date(value),
  })
  joinDate: Date;
}
```

### 2. Create Express Endpoint with CSV Processing

```typescript
import express from 'express';
import { ExpressCsvStreamProcessor } from 'typed-csv-stream';
import { Writable } from 'stream';

const app = express();

app.post('/upload', (req, res) => {
  // Create processor instance with your model and options
  const processor = new ExpressCsvStreamProcessor(User, {
    batchSize: 1000,
    delimiter: ',',
    encoding: 'utf-8',
  });

  // Create writable stream to handle processed batches
  const writable = new Writable({
    objectMode: true,
    write(batch: User[], encoding, callback) {
      try {
        // Handle each batch of processed users
        console.log(`Processing batch of ${batch.length} users`);
        // Example: Save to database
        // await saveUsers(batch);
        callback();
      } catch (error) {
        callback(error);
      }
    },
  });

  // Process the uploaded file
  processor.processRequest(req, writable, error => {
    if (error) {
      res.status(400).json({ error: error.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 3. Upload and Process CSV Files

```typescript
// Example client-side code
const formData = new FormData();
formData.append('file', csvFile);

await fetch('http://localhost:3000/upload', {
  method: 'POST',
  body: formData,
});
```

## Configuration Options

The processor accepts the following options:

```typescript
interface CsvProcessorOptions {
  delimiter?: string; // CSV delimiter (default: ',')
  skipHeader?: boolean; // Skip header row (default: false)
  encoding?: string; // File encoding (default: 'utf-8')
  batchSize: number; // Number of records per batch
}
```

## Decorator Options

The `@CsvHeader` decorator accepts either a string (column name) or an options object:

```typescript
interface CsvHeaderOptions {
  name: string; // CSV column name
  parser?: (value: string) => any; // Custom parser function
}
```

## Type Conversion

The library automatically converts CSV string values to appropriate types based on the property decorators:

- `string`: No conversion (default)
- `number`: Converted using `Number()`
- `boolean`: Converted using string comparison (`'true'` -> `true`)
- `Date`: Converted using `new Date()`
- Custom types: Use the parser option in `@CsvHeader` decorator

## Error Handling

The processor handles various error cases:

- Invalid file type (non-CSV files)
- Missing file in request
- CSV parsing errors
- Type conversion failures
- Custom parser errors

Errors are passed to the completion callback with appropriate error messages:

```typescript
processor.processRequest(req, writable, error => {
  if (error) {
    console.error('Processing failed:', error.message);
    // Handle error appropriately
  }
});
```

## Example CSV Format

For the User model defined above, your CSV file should look like:

```csv
name,age,isActive,joinDate
John Doe,30,true,2023-01-01
Jane Smith,25,false,2023-02-15
```

## Publishing

This package is published to npm using GitHub Actions. New versions are automatically published when a new GitHub release is created. To publish a new version:

1. Update the version in `package.json`
2. Create and push your changes
3. Create a new release on GitHub
4. The GitHub Action will automatically:
   - Run tests
   - Build the package
   - Publish to npm

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
