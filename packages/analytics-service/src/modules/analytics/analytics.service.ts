import { status } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { AnalyticsProto, AnalyticsEventProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private analyticsEventDbService: AnalyticsEventProto.AnalyticsEventDbServiceClient;

  constructor(
    @Inject(AnalyticsEventProto.ANALYTICS_EVENT_DB_SERVICE_NAME)
    private analyticsEventClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.analyticsEventDbService =
      this.analyticsEventClient.getService<AnalyticsEventProto.AnalyticsEventDbServiceClient>(
        AnalyticsEventProto.ANALYTICS_EVENT_DB_SERVICE_NAME,
      );
  }

  // ============================================================================
  // VISIT EVENTS - Fully implemented via db-service
  // This is the pattern for teammates to copy for click, input, custom events.
  // ============================================================================

  async logVisitEvent(
    event: AnalyticsProto.VisitEventRequest,
  ): Promise<AnalyticsProto.VisitEventResponse> {
    if (
      !event ||
      !event.userId ||
      !event.pageUrl ||
      event.userId.length === 0 ||
      event.pageUrl.length === 0
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid VisitEventRequest: userId and pageUrl are required',
      });
    }

    const properties = {
      pageUrl: event.pageUrl,
      userId: event.userId,
    };

    const response = await lastValueFrom(
      this.analyticsEventDbService.createAnalyticsEvent({
        projectId: event.configId,
        environment: event.environment,
        type: AnalyticsEventProto.AnalyticsEventType.VISIT,
        category: 'Activity',
        subcategory: 'Visit',
        properties: JSON.stringify(properties),
      }),
    );

    const eventProperties = JSON.parse(response.properties);

    return {
      id: String(response.id),
      category: response.category,
      subcategory: response.subcategory,
      projectId: String(response.projectId),
      environment: response.environment,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      eventProperties: {
        pageUrl: eventProperties.pageUrl,
        userId: eventProperties.userId,
      },
    };
  }

  async getVisitEventsPaginated(
    request: AnalyticsProto.GetVisitEventsRequest,
  ): Promise<AnalyticsProto.GetVisitEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetVisitEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAnalyticsEventsPaginated({
        projectId: request.configId,
        environment: request.environment,
        type: AnalyticsEventProto.AnalyticsEventType.VISIT,
        afterId: request.afterId || undefined,
        limit: request.limit || undefined,
        afterTime: request.afterTime || undefined,
      }),
    );

    return {
      events: response.events.map((event) => {
        const eventProperties = JSON.parse(event.properties);
        return {
          id: String(event.id),
          category: event.category,
          subcategory: event.subcategory,
          projectId: String(event.projectId),
          environment: event.environment,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          eventProperties: {
            pageUrl: eventProperties.pageUrl,
            userId: eventProperties.userId,
          },
        };
      }),
      afterId: response.afterId,
    };
  }

  async getAllVisitEvents(
    request: AnalyticsProto.GetAllVisitEventsRequest,
  ): Promise<AnalyticsProto.GetAllVisitEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllVisitEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAllAnalyticsEvents({
        projectId: request.configId,
        type: AnalyticsEventProto.AnalyticsEventType.VISIT,
        afterTime: request.afterTime || undefined,
        limit: request.limit || undefined,
      }),
    );

    return {
      events: response.events.map((event) => {
        const eventProperties = JSON.parse(event.properties);
        return {
          id: String(event.id),
          category: event.category,
          subcategory: event.subcategory,
          projectId: String(event.projectId),
          environment: event.environment,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          eventProperties: {
            pageUrl: eventProperties.pageUrl,
            userId: eventProperties.userId,
          },
        };
      }),
    };
  }

  // ============================================================================
  // CLICK EVENTS - Stub: to be implemented in #263 by copying visit pattern
  // ============================================================================

  async logClickEvent(
    _event: AnalyticsProto.ClickEventRequest,
  ): Promise<AnalyticsProto.ClickEventResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'logClickEvent not yet implemented - see #263. Copy the visit pattern from logVisitEvent.',
    });
  }

  async getClickEventsPaginated(
    _request: AnalyticsProto.GetClickEventsRequest,
  ): Promise<AnalyticsProto.GetClickEventsResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'getClickEventsPaginated not yet implemented - see #263. Copy the visit pattern.',
    });
  }

  async getAllClickEvents(
    _request: AnalyticsProto.GetAllClickEventsRequest,
  ): Promise<AnalyticsProto.GetAllClickEventsResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'getAllClickEvents not yet implemented - see #263. Copy the visit pattern.',
    });
  }

  // ============================================================================
  // INPUT EVENTS - Stub: to be implemented in #263 by copying visit pattern
  // ============================================================================

  async logInputEvent(
    _event: AnalyticsProto.InputEventRequest,
  ): Promise<AnalyticsProto.InputEventResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'logInputEvent not yet implemented - see #263. Copy the visit pattern from logVisitEvent.',
    });
  }

  async getInputEventsPaginated(
    _request: AnalyticsProto.GetInputEventsRequest,
  ): Promise<AnalyticsProto.GetInputEventsResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'getInputEventsPaginated not yet implemented - see #263. Copy the visit pattern.',
    });
  }

  async getAllInputEvents(
    _request: AnalyticsProto.GetAllInputEventsRequest,
  ): Promise<AnalyticsProto.GetAllInputEventsResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'getAllInputEvents not yet implemented - see #263. Copy the visit pattern.',
    });
  }

  // ============================================================================
  // CUSTOM EVENTS - Stub: to be implemented in #263 by copying visit pattern
  // ============================================================================

  async logCustomEvent(
    _event: AnalyticsProto.CustomEventRequest,
  ): Promise<AnalyticsProto.CustomEventResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'logCustomEvent not yet implemented - see #263. Copy the visit pattern from logVisitEvent.',
    });
  }

  async getCustomEventsPaginated(
    _request: AnalyticsProto.GetCustomEventsRequest,
  ): Promise<AnalyticsProto.GetCustomEventsResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'getCustomEventsPaginated not yet implemented - see #263. Copy the visit pattern.',
    });
  }

  async getAllCustomEvents(
    _request: AnalyticsProto.GetAllCustomEventsRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventsResponse> {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message:
        'getAllCustomEvents not yet implemented - see #263. Copy the visit pattern.',
    });
  }

  // ============================================================================
  // CUSTOM EVENT TYPES - Returns empty list for now, to be filled in #263
  // ============================================================================

  async getCustomEventTypes(
    _request: AnalyticsProto.CustomEventTypeRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventTypeResponse> {
    // Return empty list so dashboard doesn't crash. #263 will implement this
    // by calling analyticsEventDbService.getCustomEventTypes().
    return { eventTypes: [] };
  }

  // ============================================================================
  // CUSTOM GRAPH TYPES - Returns empty list (harmless stub)
  // ============================================================================

  async getCustomGraphTypesById(
    _request: AnalyticsProto.CustomGraphTypeRequest,
  ): Promise<AnalyticsProto.CustomGraphTypeResponse> {
    // Return empty list so dashboard doesn't crash. Graph types can be
    // implemented later if needed, or remain a stub.
    return { graphs: [] };
  }
}
