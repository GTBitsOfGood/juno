import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';
import { AnalyticsProto } from 'juno-proto';

// Request DTOs for logging events
export class LogClickEventRequest {
  @ApiProperty({
    type: 'string',
    description: 'The ID of the object that was clicked',
    example: 'button_submit_form',
  })
  @IsNotEmpty()
  @IsString()
  objectId: string;

  @ApiProperty({
    type: 'string',
    description: 'The ID of the user who performed the click',
    example: 'user_12345',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class LogVisitEventRequest {
  @ApiProperty({
    type: 'string',
    description: 'The URL of the page that was visited',
    example: 'https://example.com/dashboard',
  })
  @IsNotEmpty()
  @IsString()
  pageUrl: string;

  @ApiProperty({
    type: 'string',
    description: 'The ID of the user who visited the page',
    example: 'user_12345',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class LogInputEventRequest {
  @ApiProperty({
    type: 'string',
    description: 'The ID of the input object',
    example: 'input_search_field',
  })
  @IsNotEmpty()
  @IsString()
  objectId: string;

  @ApiProperty({
    type: 'string',
    description: 'The ID of the user who interacted with the input',
    example: 'user_12345',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    type: 'string',
    description: 'The text value entered in the input',
    example: 'search query',
  })
  @IsNotEmpty()
  @IsString()
  textValue: string;
}

export class LogCustomEventRequest {
  @ApiProperty({
    type: 'string',
    description: 'The category of the custom event',
    example: 'user_action',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    type: 'string',
    description: 'The subcategory of the custom event',
    example: 'form_submission',
  })
  @IsNotEmpty()
  @IsString()
  subcategory: string;

  @ApiProperty({
    type: 'object',
    description: 'Custom properties for the event',
    example: { formType: 'contact', source: 'homepage' },
  })
  @IsObject()
  properties: { [key: string]: string };
}

// Query DTOs for retrieving events
export class GetCustomEventTypesQuery {
  @ApiProperty({
    type: 'string',
    description: 'The name of the project',
    example: 'my-project',
  })
  @IsNotEmpty()
  @IsString()
  projectName: string;
}

export class GetCustomGraphTypesQuery {
  @ApiProperty({
    type: 'string',
    description: 'The name of the project',
    example: 'my-project',
  })
  @IsNotEmpty()
  @IsString()
  projectName: string;

  @ApiProperty({
    type: 'string',
    description: 'The ID of the event type',
    example: 'event_type_123',
  })
  @IsNotEmpty()
  @IsString()
  eventTypeId: string;
}

export class GetEventsQuery {
  @ApiProperty({
    type: 'string',
    description: 'The name of the project',
    example: 'my-project',
  })
  @IsNotEmpty()
  @IsString()
  projectName: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Pagination cursor - ID to start after',
    example: 'event_12345',
  })
  @IsOptional()
  @IsString()
  afterId?: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'Environment filter',
    example: 'production',
  })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Maximum number of events to return',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    type: 'string',
    description: 'ISO timestamp to filter events after',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  afterTime?: string;
}

export class GetCustomEventsQuery extends GetEventsQuery {
  @ApiProperty({
    type: 'string',
    description: 'The category of custom events to retrieve',
    example: 'user_action',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    type: 'string',
    description: 'The subcategory of custom events to retrieve',
    example: 'form_submission',
  })
  @IsNotEmpty()
  @IsString()
  subcategory: string;
}

export class GetAllEventsQuery {
  @ApiProperty({
    type: 'string',
    description: 'The name of the project',
    example: 'my-project',
  })
  @IsNotEmpty()
  @IsString()
  projectName: string;

  @ApiPropertyOptional({
    type: 'string',
    description: 'ISO timestamp to filter events after',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  afterTime?: string;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Maximum number of events to return',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class GetAllCustomEventsQuery extends GetAllEventsQuery {
  @ApiProperty({
    type: 'string',
    description: 'The category of custom events to retrieve',
    example: 'user_action',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    type: 'string',
    description: 'The subcategory of custom events to retrieve',
    example: 'form_submission',
  })
  @IsNotEmpty()
  @IsString()
  subcategory: string;
}

// Response DTOs
export class ClickEventProperties {
  @ApiProperty({ type: 'string', description: 'Object ID' })
  objectId: string;

  @ApiProperty({ type: 'string', description: 'User ID' })
  userId: string;
}

export class VisitEventProperties {
  @ApiProperty({ type: 'string', description: 'Page URL' })
  pageUrl: string;

  @ApiProperty({ type: 'string', description: 'User ID' })
  userId: string;
}

export class InputEventProperties {
  @ApiProperty({ type: 'string', description: 'Object ID' })
  objectId: string;

  @ApiProperty({ type: 'string', description: 'User ID' })
  userId: string;

  @ApiProperty({ type: 'string', description: 'Text value' })
  textValue: string;
}

export class ClickEventResponse {
  @ApiProperty({ type: 'string', description: 'Event ID' })
  id: string;

  @ApiProperty({ type: 'string', description: 'Event category' })
  category: string;

  @ApiProperty({ type: 'string', description: 'Event subcategory' })
  subcategory: string;

  @ApiProperty({ type: 'string', description: 'Project ID' })
  projectId: string;

  @ApiProperty({ type: 'string', description: 'Environment' })
  environment: string;

  @ApiProperty({ type: 'string', description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ type: 'string', description: 'Updated timestamp' })
  updatedAt: string;

  @ApiProperty({ type: ClickEventProperties, description: 'Event properties' })
  eventProperties: ClickEventProperties;

  constructor(response: AnalyticsProto.ClickEventResponse) {
    this.id = response.id;
    this.category = response.category;
    this.subcategory = response.subcategory;
    this.projectId = response.projectId;
    this.environment = response.environment;
    this.createdAt = response.createdAt;
    this.updatedAt = response.updatedAt;
    this.eventProperties = response.eventProperties!;
  }
}

export class VisitEventResponse {
  @ApiProperty({ type: 'string', description: 'Event ID' })
  id: string;

  @ApiProperty({ type: 'string', description: 'Event category' })
  category: string;

  @ApiProperty({ type: 'string', description: 'Event subcategory' })
  subcategory: string;

  @ApiProperty({ type: 'string', description: 'Project ID' })
  projectId: string;

  @ApiProperty({ type: 'string', description: 'Environment' })
  environment: string;

  @ApiProperty({ type: 'string', description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ type: 'string', description: 'Updated timestamp' })
  updatedAt: string;

  @ApiProperty({ type: VisitEventProperties, description: 'Event properties' })
  eventProperties: VisitEventProperties;

  constructor(response: AnalyticsProto.VisitEventResponse) {
    this.id = response.id;
    this.category = response.category;
    this.subcategory = response.subcategory;
    this.projectId = response.projectId;
    this.environment = response.environment;
    this.createdAt = response.createdAt;
    this.updatedAt = response.updatedAt;
    this.eventProperties = response.eventProperties!;
  }
}

export class InputEventResponse {
  @ApiProperty({ type: 'string', description: 'Event ID' })
  id: string;

  @ApiProperty({ type: 'string', description: 'Event category' })
  category: string;

  @ApiProperty({ type: 'string', description: 'Event subcategory' })
  subcategory: string;

  @ApiProperty({ type: 'string', description: 'Project ID' })
  projectId: string;

  @ApiProperty({ type: 'string', description: 'Environment' })
  environment: string;

  @ApiProperty({ type: 'string', description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ type: 'string', description: 'Updated timestamp' })
  updatedAt: string;

  @ApiProperty({ type: InputEventProperties, description: 'Event properties' })
  eventProperties: InputEventProperties;

  constructor(response: AnalyticsProto.InputEventResponse) {
    this.id = response.id;
    this.category = response.category;
    this.subcategory = response.subcategory;
    this.projectId = response.projectId;
    this.environment = response.environment;
    this.createdAt = response.createdAt;
    this.updatedAt = response.updatedAt;
    this.eventProperties = response.eventProperties!;
  }
}

export class CustomEventResponse {
  @ApiProperty({ type: 'string', description: 'Event ID' })
  id: string;

  @ApiProperty({ type: 'string', description: 'Event type ID' })
  eventTypeId: string;

  @ApiProperty({ type: 'string', description: 'Project ID' })
  projectId: string;

  @ApiProperty({ type: 'string', description: 'Environment' })
  environment: string;

  @ApiProperty({ type: 'string', description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ type: 'string', description: 'Updated timestamp' })
  updatedAt: string;

  @ApiProperty({ type: 'object', description: 'Custom properties' })
  properties: { [key: string]: string };

  constructor(response: AnalyticsProto.CustomEventResponse) {
    this.id = response.id;
    this.eventTypeId = response.eventTypeId;
    this.projectId = response.projectId;
    this.environment = response.environment;
    this.createdAt = response.createdAt;
    this.updatedAt = response.updatedAt;
    this.properties = response.properties;
  }
}

export class CustomEventTypeResponse {
  @ApiProperty({ type: 'string', description: 'Event type ID' })
  id: string;

  @ApiProperty({ type: 'string', description: 'Category' })
  category: string;

  @ApiProperty({ type: 'string', description: 'Subcategory' })
  subcategory: string;

  @ApiProperty({ type: [String], description: 'Properties' })
  properties: string[];

  @ApiProperty({ type: 'string', description: 'Project ID' })
  projectId: string;

  constructor(response: AnalyticsProto.CustomEventTypeResponse) {
    this.id = response.id;
    this.category = response.category;
    this.subcategory = response.subcategory;
    this.properties = response.properties;
    this.projectId = response.projectId;
  }
}

export class CustomGraphType {
  @ApiProperty({ type: 'string', description: 'Graph ID' })
  id: string;

  @ApiProperty({ type: 'string', description: 'Event type ID' })
  eventTypeId: string;

  @ApiProperty({ type: 'string', description: 'Project ID' })
  projectId: string;

  @ApiProperty({ type: 'string', description: 'Graph title' })
  graphTitle: string;

  @ApiProperty({ type: 'string', description: 'X-axis property' })
  xProperty: string;

  @ApiProperty({ type: 'string', description: 'Y-axis property' })
  yProperty: string;

  @ApiProperty({ type: 'string', description: 'Graph type' })
  graphType: string;

  @ApiProperty({ type: 'string', description: 'Caption' })
  caption: string;
}

export class CustomGraphTypeResponse {
  @ApiProperty({ type: [CustomGraphType], description: 'Graph types' })
  graphs: CustomGraphType[];

  constructor(response: AnalyticsProto.CustomGraphTypeResponse) {
    this.graphs = response.graphs;
  }
}

export class GetClickEventsResponse {
  @ApiProperty({ type: [ClickEventResponse], description: 'Click events' })
  events: ClickEventResponse[];

  @ApiProperty({ type: 'string', description: 'Pagination cursor' })
  afterId: string;

  constructor(response: AnalyticsProto.GetClickEventsResponse) {
    this.events = response.events.map((event) => new ClickEventResponse(event));
    this.afterId = response.afterId;
  }
}

export class GetVisitEventsResponse {
  @ApiProperty({ type: [VisitEventResponse], description: 'Visit events' })
  events: VisitEventResponse[];

  @ApiProperty({ type: 'string', description: 'Pagination cursor' })
  afterId: string;

  constructor(response: AnalyticsProto.GetVisitEventsResponse) {
    this.events = response.events.map((event) => new VisitEventResponse(event));
    this.afterId = response.afterId;
  }
}

export class GetInputEventsResponse {
  @ApiProperty({ type: [InputEventResponse], description: 'Input events' })
  events: InputEventResponse[];

  @ApiProperty({ type: 'string', description: 'Pagination cursor' })
  afterId: string;

  constructor(response: AnalyticsProto.GetInputEventsResponse) {
    this.events = response.events.map((event) => new InputEventResponse(event));
    this.afterId = response.afterId;
  }
}

export class GetCustomEventsResponse {
  @ApiProperty({ type: [CustomEventResponse], description: 'Custom events' })
  events: CustomEventResponse[];

  @ApiProperty({ type: 'string', description: 'Pagination cursor' })
  afterId: string;

  constructor(response: AnalyticsProto.GetCustomEventsResponse) {
    this.events = response.events.map(
      (event) => new CustomEventResponse(event),
    );
    this.afterId = response.afterId;
  }
}

export class GetAllClickEventsResponse {
  @ApiProperty({ type: [ClickEventResponse], description: 'All click events' })
  events: ClickEventResponse[];

  constructor(response: AnalyticsProto.GetAllClickEventsResponse) {
    this.events = response.events.map((event) => new ClickEventResponse(event));
  }
}

export class GetAllVisitEventsResponse {
  @ApiProperty({ type: [VisitEventResponse], description: 'All visit events' })
  events: VisitEventResponse[];

  constructor(response: AnalyticsProto.GetAllVisitEventsResponse) {
    this.events = response.events.map((event) => new VisitEventResponse(event));
  }
}

export class GetAllInputEventsResponse {
  @ApiProperty({ type: [InputEventResponse], description: 'All input events' })
  events: InputEventResponse[];

  constructor(response: AnalyticsProto.GetAllInputEventsResponse) {
    this.events = response.events.map((event) => new InputEventResponse(event));
  }
}

export class GetAllCustomEventsResponse {
  @ApiProperty({
    type: [CustomEventResponse],
    description: 'All custom events',
  })
  events: CustomEventResponse[];

  constructor(response: AnalyticsProto.GetAllCustomEventsResponse) {
    this.events = response.events.map(
      (event) => new CustomEventResponse(event),
    );
  }
}
