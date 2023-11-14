import { HttpException, HttpStatus } from '@nestjs/common';
import { BogException } from './bog.exception';

export class MissingRequestBodyException extends BogException {
  constructor(missingArgs: string[] | string) {
    if (missingArgs instanceof Array) {
      super(
        new HttpException(
          `Body is missing: ${missingArgs
            .map((arg) => ` ${arg}`)
            .join()
            .trim()}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    } else {
      super(
        new HttpException(
          `Body is missing: ${missingArgs}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    }
  }
}
