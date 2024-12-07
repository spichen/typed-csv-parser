import 'reflect-metadata';
import { CsvHeader } from '../../csv-decorator.ts';

export class User {
  @CsvHeader('name')
  public name!: string;

  @Reflect.metadata('design:type', Number)
  @CsvHeader('age')
  public age!: number;

  @Reflect.metadata('design:type', Boolean)
  @CsvHeader('active')
  public active!: boolean;
}
