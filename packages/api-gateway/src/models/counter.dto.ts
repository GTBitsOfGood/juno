import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
// import { CounterProto } from 'juno-proto';

// export class IncrementCounterRequest {
//   @ApiProperty({
//     type: 'string',
//     description: 'The unique ID of the counter to increment',
//   })
//   @IsNotEmpty()
//   @IsString()
//   counterId: string;
// }

// export class DecrementCounterRequest {
//   @ApiProperty({
//     type: 'string',
//     description: 'The unique ID of the counter to decrement',
//   })
//   @IsNotEmpty()
//   @IsString()
//   counterId: string;
// }

// export class ResetCounterRequest {
//   @ApiProperty({
//     type: 'string',
//     description: 'The unique ID of the counter to reset',
//   })
//   @IsNotEmpty()
//   @IsString()
//   counterId: string;
// }

// export class GetCounterRequest {
//   @ApiProperty({
//     type: 'string',
//     description: 'The unique ID of the counter to retrieve',
//   })
//   @IsNotEmpty()
//   @IsString()
//   counterId: string;
// }

export class CounterResponse {
  @ApiProperty({
    type: 'number',
    description: 'The current value of the counter',
  })
  @IsNotEmpty()
  @IsInt()
  value: number;

  // constructor(
  //   counterData:
  //     | CounterProto.IncrementCounterResponse
  //     | CounterProto.DecrementCounterResponse
  //     | CounterProto.ResetCounterResponse
  //     | CounterProto.GetCounterResponse,
  // ) {
  //   this.value = counterData.value;
  // }
  constructor(counter) {
    this.value = counter.value;
  }
}
