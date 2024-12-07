import 'reflect-metadata';
import { CsvHeader } from '../../csv-decorator.ts';

export class User {
  @CsvHeader('name')
  public name: string;

  @CsvHeader('age')
  public age: number;

  @CsvHeader('active')
  public active: boolean;
}
