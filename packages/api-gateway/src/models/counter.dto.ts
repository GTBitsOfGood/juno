export class CounterResponse {
  counterId: string;
  value: number;

  constructor(partial: Partial<CounterResponse>) {
    Object.assign(this, partial);
  }
}
