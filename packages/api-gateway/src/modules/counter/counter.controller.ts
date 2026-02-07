import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CounterProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { ApiKey } from 'src/decorators/api_key.decorator';
import { AuthCommonProto } from 'juno-proto';
import { CounterResponse } from 'src/models/counter.dto';

const { COUNTER_DB_SERVICE_NAME } = CounterProto;

@ApiBearerAuth('API_Key')
@ApiTags('counter')
@Controller('counter')
export class CounterController implements OnModuleInit {
  private counterDbService: CounterProto.CounterDbServiceClient;

  constructor(
    @Inject(COUNTER_DB_SERVICE_NAME)
    private counterDbClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.counterDbService =
      this.counterDbClient.getService<CounterProto.CounterDbServiceClient>(
        COUNTER_DB_SERVICE_NAME,
      );
  }

  @Post(':id/increment')
  @ApiOperation({ summary: 'Increment counter' })
  @ApiOkResponse({
    description: 'Counter incremented successfully',
    type: CounterResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async incrementCounter(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('id') id: string,
  ): Promise<CounterResponse> {
    if (!id || id.trim() == '') {
      throw new BadRequestException('Counter ID must be provided');
    }

    const response = await lastValueFrom(
      this.counterDbService.incrementCounter({ id }),
    );
    return new CounterResponse(response);
  }

  @Post(':id/decrement')
  @ApiOperation({ summary: 'Decrement counter' })
  @ApiOkResponse({
    description: 'Counter decremented successfully',
    type: CounterResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async decrementCounter(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('id') id: string,
  ): Promise<CounterResponse> {
    if (!id || id.trim() == '') {
      throw new BadRequestException('Counter ID must be provided');
    }

    const response = await lastValueFrom(
      this.counterDbService.decrementCounter({ id }),
    );
    return new CounterResponse(response);
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Reset counter' })
  @ApiOkResponse({
    description: 'Counter reset successfully',
    type: CounterResponse,
  })
  @ApiNotFoundResponse({
    description: 'Counter not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async resetCounter(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('id') id: string,
  ): Promise<CounterResponse> {
    if (!id || id.trim() == '') {
      throw new BadRequestException('Counter ID must be provided');
    }

    const response = await lastValueFrom(
      this.counterDbService.resetCounter({ id }),
    );
    return new CounterResponse(response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get counter' })
  @ApiOkResponse({
    description: 'Counter retrieved successfully',
    type: CounterResponse,
  })
  @ApiNotFoundResponse({
    description: 'Counter not found',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async getCounter(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @Param('id') id: string,
  ): Promise<CounterResponse> {
    if (!id || id.trim() == '') {
      throw new BadRequestException('Counter ID must be provided');
    }

    const response = await lastValueFrom(
      this.counterDbService.getCounter({ id }),
    );
    return new CounterResponse(response);
  }
}
