import { Controller } from '@nestjs/common';
import { AnalyticsEventProto } from 'juno-proto';
import { AnalyticsEventService } from './analytics_event.service';

@Controller()
@AnalyticsEventProto.AnalyticsEventDbServiceControllerMethods()
export class AnalyticsEventDbController
  implements AnalyticsEventProto.AnalyticsEventDbServiceController
{
  constructor(private readonly analyticsEventService: AnalyticsEventService) {}

  async createAnalyticsEvent(
    request: AnalyticsEventProto.CreateAnalyticsEventRequest,
  ): Promise<AnalyticsEventProto.AnalyticsEventResponse> {
    const event =
      await this.analyticsEventService.createAnalyticsEvent(request);

    return {
      id: event.id,
      projectId: event.projectId,
      environment: event.environment,
      type: AnalyticsEventProto.AnalyticsEventType[
        event.type
      ] as unknown as AnalyticsEventProto.AnalyticsEventType,
      category: event.category,
      subcategory: event.subcategory,
      properties: JSON.stringify(event.properties),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  async getAnalyticsEventsPaginated(
    request: AnalyticsEventProto.GetAnalyticsEventsRequest,
  ): Promise<AnalyticsEventProto.GetAnalyticsEventsResponse> {
    const { events, afterId } =
      await this.analyticsEventService.getAnalyticsEventsPaginated(request);

    return {
      events: events.map((event) => ({
        id: event.id,
        projectId: event.projectId,
        environment: event.environment,
        type: AnalyticsEventProto.AnalyticsEventType[
          event.type
        ] as unknown as AnalyticsEventProto.AnalyticsEventType,
        category: event.category,
        subcategory: event.subcategory,
        properties: JSON.stringify(event.properties),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      })),
      afterId,
    };
  }

  async getAllAnalyticsEvents(
    request: AnalyticsEventProto.GetAllAnalyticsEventsRequest,
  ): Promise<AnalyticsEventProto.GetAllAnalyticsEventsResponse> {
    const events =
      await this.analyticsEventService.getAllAnalyticsEvents(request);

    return {
      events: events.map((event) => ({
        id: event.id,
        projectId: event.projectId,
        environment: event.environment,
        type: AnalyticsEventProto.AnalyticsEventType[
          event.type
        ] as unknown as AnalyticsEventProto.AnalyticsEventType,
        category: event.category,
        subcategory: event.subcategory,
        properties: JSON.stringify(event.properties),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      })),
    };
  }

  async getCustomEventTypes(
    request: AnalyticsEventProto.GetCustomEventTypesRequest,
  ): Promise<AnalyticsEventProto.GetCustomEventTypesResponse> {
    const eventTypes = await this.analyticsEventService.getCustomEventTypes(
      Number(request.projectId),
    );

    return {
      eventTypes: eventTypes.map((eventType) => ({
        id: `${request.projectId}-${eventType.category}-${eventType.subcategory}`,
        category: eventType.category,
        subcategory: eventType.subcategory,
        properties: eventType.properties,
        projectId: String(request.projectId),
      })),
    };
  }
}
