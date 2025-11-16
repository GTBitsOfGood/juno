import {
  Body,
  Controller,
  Get,
  Query,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { validateOrReject } from 'class-validator';
import { AnalyticsProto, AuthCommonProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiKey } from 'src/decorators/api_key.decorator';
import { ProjectId } from 'src/decorators/project_id.decorator';
import {
  LogClickEventRequest,
  LogVisitEventRequest,
  LogInputEventRequest,
  LogCustomEventRequest,
  GetCustomEventTypesQuery,
  GetCustomGraphTypesQuery,
  GetEventsQuery,
  GetCustomEventsQuery,
  GetAllEventsQuery,
  GetAllCustomEventsQuery,
  ClickEventResponse,
  VisitEventResponse,
  InputEventResponse,
  CustomEventResponse,
  CustomGraphTypeResponse,
  GetClickEventsResponse,
  GetVisitEventsResponse,
  GetInputEventsResponse,
  GetCustomEventsResponse,
  GetAllClickEventsResponse,
  GetAllVisitEventsResponse,
  GetAllInputEventsResponse,
  GetAllCustomEventsResponse,
  GetAllCustomEventTypeResponse,
} from 'src/models/analytics.dto';

const { ANALYTICS_SERVICE_NAME } = AnalyticsProto;

@ApiBearerAuth('API_Key')
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController implements OnModuleInit {
  private analyticsService: AnalyticsProto.AnalyticsServiceClient;

  constructor(
    @Inject(ANALYTICS_SERVICE_NAME) private analyticsClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.analyticsService =
      this.analyticsClient.getService<AnalyticsProto.AnalyticsServiceClient>(
        ANALYTICS_SERVICE_NAME,
      );
  }

  @Post('events/click')
  @ApiOperation({ summary: 'Log a click event' })
  @ApiCreatedResponse({
    description: 'Click event logged successfully',
    type: ClickEventResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async logClickEvent(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Body() request: LogClickEventRequest,
  ): Promise<ClickEventResponse> {
    await validateOrReject(request);

    const response = await lastValueFrom(
      this.analyticsService.logClickEvent({
        objectId: request.objectId,
        userId: request.userId,
        configId: projectId,
        environment: apiKey.environment,
        configEnvironment: apiKey.environment,
      }),
    );

    return new ClickEventResponse(response);
  }

  @Post('events/visit')
  @ApiOperation({ summary: 'Log a visit event' })
  @ApiCreatedResponse({
    description: 'Visit event logged successfully',
    type: VisitEventResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async logVisitEvent(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Body() request: LogVisitEventRequest,
  ): Promise<VisitEventResponse> {
    await validateOrReject(request);

    const response = await lastValueFrom(
      this.analyticsService.logVisitEvent({
        pageUrl: request.pageUrl,
        userId: request.userId,
        configId: projectId,
        environment: apiKey.environment,
        configEnvironment: apiKey.environment,
      }),
    );

    return new VisitEventResponse(response);
  }

  @Post('events/input')
  @ApiOperation({ summary: 'Log an input event' })
  @ApiCreatedResponse({
    description: 'Input event logged successfully',
    type: InputEventResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async logInputEvent(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Body() request: LogInputEventRequest,
  ): Promise<InputEventResponse> {
    await validateOrReject(request);

    const response = await lastValueFrom(
      this.analyticsService.logInputEvent({
        objectId: request.objectId,
        userId: request.userId,
        textValue: request.textValue,
        configId: projectId,
        environment: apiKey.environment,
        configEnvironment: apiKey.environment,
      }),
    );

    return new InputEventResponse(response);
  }

  @Post('events/custom')
  @ApiOperation({ summary: 'Log a custom event' })
  @ApiCreatedResponse({
    description: 'Custom event logged successfully',
    type: CustomEventResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  async logCustomEvent(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Body() request: LogCustomEventRequest,
  ): Promise<CustomEventResponse> {
    await validateOrReject(request);

    const response = await lastValueFrom(
      this.analyticsService.logCustomEvent({
        category: request.category,
        subcategory: request.subcategory,
        properties: request.properties,
        environment: apiKey.environment,
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new CustomEventResponse(response);
  }

  @Get('custom-event-types')
  @ApiOperation({ summary: 'Get custom event types for a project' })
  @ApiOkResponse({
    description: 'Custom event types retrieved successfully',
    type: GetAllCustomEventTypeResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  async getCustomEventTypes(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetCustomEventTypesQuery,
  ): Promise<GetAllCustomEventTypeResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getCustomEventTypes({
        projectName: query.projectName,
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetAllCustomEventTypeResponse(response);
  }

  @Get('custom-graph-types')
  @ApiOperation({ summary: 'Get custom graph types by event type ID' })
  @ApiOkResponse({
    description: 'Custom graph types retrieved successfully',
    type: CustomGraphTypeResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({ name: 'eventTypeId', type: String, description: 'Event type ID' })
  async getCustomGraphTypesById(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetCustomGraphTypesQuery,
  ): Promise<CustomGraphTypeResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getCustomGraphTypesById({
        projectName: query.projectName,
        eventTypeId: query.eventTypeId,
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new CustomGraphTypeResponse(response);
  }

  @Get('events/click')
  @ApiOperation({ summary: 'Get click events with pagination' })
  @ApiOkResponse({
    description: 'Click events retrieved successfully',
    type: GetClickEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({
    name: 'afterId',
    type: String,
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'environment',
    type: String,
    required: false,
    description: 'Environment filter',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  async getClickEventsPaginated(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetEventsQuery,
  ): Promise<GetClickEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getClickEventsPaginated({
        projectName: query.projectName,
        afterId: query.afterId || '',
        environment: query.environment || '',
        limit: query.limit || 0,
        afterTime: query.afterTime || '',
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetClickEventsResponse(response);
  }

  @Get('events/click/all')
  @ApiOperation({ summary: 'Get all click events' })
  @ApiOkResponse({
    description: 'All click events retrieved successfully',
    type: GetAllClickEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  async getAllClickEvents(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetAllEventsQuery,
  ): Promise<GetAllClickEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getAllClickEvents({
        projectName: query.projectName,
        afterTime: query.afterTime || '',
        limit: query.limit || 0,
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetAllClickEventsResponse(response);
  }

  @Get('events/visit')
  @ApiOperation({ summary: 'Get visit events with pagination' })
  @ApiOkResponse({
    description: 'Visit events retrieved successfully',
    type: GetVisitEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({
    name: 'afterId',
    type: String,
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'environment',
    type: String,
    required: false,
    description: 'Environment filter',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  async getVisitEventsPaginated(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetEventsQuery,
  ): Promise<GetVisitEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getVisitEventsPaginated({
        projectName: query.projectName,
        afterId: query.afterId || '',
        environment: query.environment || '',
        limit: query.limit || 0,
        afterTime: query.afterTime || '',
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetVisitEventsResponse(response);
  }

  @Get('events/visit/all')
  @ApiOperation({ summary: 'Get all visit events' })
  @ApiOkResponse({
    description: 'All visit events retrieved successfully',
    type: GetAllVisitEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  async getAllVisitEvents(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetAllEventsQuery,
  ): Promise<GetAllVisitEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getAllVisitEvents({
        projectName: query.projectName,
        afterTime: query.afterTime || '',
        limit: query.limit || 0,
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetAllVisitEventsResponse(response);
  }

  @Get('events/input')
  @ApiOperation({ summary: 'Get input events with pagination' })
  @ApiOkResponse({
    description: 'Input events retrieved successfully',
    type: GetInputEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({
    name: 'afterId',
    type: String,
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'environment',
    type: String,
    required: false,
    description: 'Environment filter',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  async getInputEventsPaginated(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetEventsQuery,
  ): Promise<GetInputEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getInputEventsPaginated({
        projectName: query.projectName,
        afterId: query.afterId || '',
        environment: query.environment || '',
        limit: query.limit || 0,
        afterTime: query.afterTime || '',
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetInputEventsResponse(response);
  }

  @Get('events/input/all')
  @ApiOperation({ summary: 'Get all input events' })
  @ApiOkResponse({
    description: 'All input events retrieved successfully',
    type: GetAllInputEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  async getAllInputEvents(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetAllEventsQuery,
  ): Promise<GetAllInputEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getAllInputEvents({
        projectName: query.projectName,
        afterTime: query.afterTime || '',
        limit: query.limit || 0,
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetAllInputEventsResponse(response);
  }

  @Get('events/custom')
  @ApiOperation({ summary: 'Get custom events with pagination' })
  @ApiOkResponse({
    description: 'Custom events retrieved successfully',
    type: GetCustomEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({ name: 'category', type: String, description: 'Event category' })
  @ApiQuery({
    name: 'subcategory',
    type: String,
    description: 'Event subcategory',
  })
  @ApiQuery({
    name: 'afterId',
    type: String,
    required: false,
    description: 'Pagination cursor',
  })
  @ApiQuery({
    name: 'environment',
    type: String,
    required: false,
    description: 'Environment filter',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  async getCustomEventsPaginated(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetCustomEventsQuery,
  ): Promise<GetCustomEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getCustomEventsPaginated({
        projectName: query.projectName,
        category: query.category,
        subcategory: query.subcategory,
        afterId: query.afterId || '',
        environment: query.environment || '',
        limit: query.limit || 0,
        afterTime: query.afterTime || '',
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetCustomEventsResponse(response);
  }

  @Get('events/custom/all')
  @ApiOperation({ summary: 'Get all custom events' })
  @ApiOkResponse({
    description: 'All custom events retrieved successfully',
    type: GetAllCustomEventsResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiQuery({ name: 'projectName', type: String, description: 'Project name' })
  @ApiQuery({ name: 'category', type: String, description: 'Event category' })
  @ApiQuery({
    name: 'subcategory',
    type: String,
    description: 'Event subcategory',
  })
  @ApiQuery({
    name: 'afterTime',
    type: String,
    required: false,
    description: 'Filter after timestamp',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Max results',
  })
  async getAllCustomEvents(
    @ApiKey() apiKey: AuthCommonProto.ApiKey,
    @ProjectId() projectId: number,
    @Query() query: GetAllCustomEventsQuery,
  ): Promise<GetAllCustomEventsResponse> {
    await validateOrReject(query);

    const response = await lastValueFrom(
      this.analyticsService.getAllCustomEvents({
        projectName: query.projectName,
        category: query.category,
        subcategory: query.subcategory,
        afterTime: query.afterTime || '',
        limit: query.limit || 0,
        configId: projectId,
        configEnvironment: apiKey.environment,
      }),
    );

    return new GetAllCustomEventsResponse(response);
  }
}
