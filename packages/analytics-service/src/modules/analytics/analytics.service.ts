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
      events: (response.events ?? []).map((event) => {
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
      events: (response.events ?? []).map((event) => {
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

  async logClickEvent(
    event: AnalyticsProto.ClickEventRequest,
  ): Promise<AnalyticsProto.ClickEventResponse> {
    if (
      !event ||
      !event.objectId ||
      !event.userId ||
      event.objectId.length === 0 ||
      event.userId.length === 0
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid ClickEventRequest: objectId and userId are required',
      });
    }

    const properties = {
      objectId: event.objectId,
      userId: event.userId,
    };

    const response = await lastValueFrom(
      this.analyticsEventDbService.createAnalyticsEvent({
        projectId: event.configId,
        environment: event.environment,
        type: AnalyticsEventProto.AnalyticsEventType.CLICK,
        category: 'Interaction',
        subcategory: 'Click',
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
        objectId: eventProperties.objectId,
        userId: eventProperties.userId,
      },
    };
  }

  async getClickEventsPaginated(
    request: AnalyticsProto.GetClickEventsRequest,
  ): Promise<AnalyticsProto.GetClickEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetClickEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAnalyticsEventsPaginated({
        projectId: request.configId,
        environment: request.environment,
        type: AnalyticsEventProto.AnalyticsEventType.CLICK,
        afterId: request.afterId || undefined,
        limit: request.limit || undefined,
        afterTime: request.afterTime || undefined,
      }),
    );

    return {
      events: (response.events ?? []).map((event) => {
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
            objectId: eventProperties.objectId,
            userId: eventProperties.userId,
          },
        };
      }),
      afterId: response.afterId,
    };
  }

  async getAllClickEvents(
    request: AnalyticsProto.GetAllClickEventsRequest,
  ): Promise<AnalyticsProto.GetAllClickEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllClickEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAllAnalyticsEvents({
        projectId: request.configId,
        type: AnalyticsEventProto.AnalyticsEventType.CLICK,
        afterTime: request.afterTime || undefined,
        limit: request.limit || undefined,
      }),
    );

    return {
      events: (response.events ?? []).map((event) => {
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
            objectId: eventProperties.objectId,
            userId: eventProperties.userId,
          },
        };
      }),
    };
  }

  async logInputEvent(
    event: AnalyticsProto.InputEventRequest,
  ): Promise<AnalyticsProto.InputEventResponse> {
    if (
      !event ||
      !event.objectId ||
      !event.userId ||
      !event.textValue ||
      event.objectId.length === 0 ||
      event.userId.length === 0 ||
      event.textValue.length === 0
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message:
          'Invalid InputEventRequest: objectId, userId, and textValue are required',
      });
    }

    const properties = {
      objectId: event.objectId,
      userId: event.userId,
      textValue: event.textValue,
    };

    const response = await lastValueFrom(
      this.analyticsEventDbService.createAnalyticsEvent({
        projectId: event.configId,
        environment: event.environment,
        type: AnalyticsEventProto.AnalyticsEventType.INPUT,
        category: 'Interaction',
        subcategory: 'Input',
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
        objectId: eventProperties.objectId,
        userId: eventProperties.userId,
        textValue: eventProperties.textValue,
      },
    };
  }

  async getInputEventsPaginated(
    request: AnalyticsProto.GetInputEventsRequest,
  ): Promise<AnalyticsProto.GetInputEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetInputEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAnalyticsEventsPaginated({
        projectId: request.configId,
        environment: request.environment,
        type: AnalyticsEventProto.AnalyticsEventType.INPUT,
        afterId: request.afterId || undefined,
        limit: request.limit || undefined,
        afterTime: request.afterTime || undefined,
      }),
    );

    return {
      events: (response.events ?? []).map((event) => {
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
            objectId: eventProperties.objectId,
            userId: eventProperties.userId,
            textValue: eventProperties.textValue,
          },
        };
      }),
      afterId: response.afterId,
    };
  }

  async getAllInputEvents(
    request: AnalyticsProto.GetAllInputEventsRequest,
  ): Promise<AnalyticsProto.GetAllInputEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllInputEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAllAnalyticsEvents({
        projectId: request.configId,
        type: AnalyticsEventProto.AnalyticsEventType.INPUT,
        afterTime: request.afterTime || undefined,
        limit: request.limit || undefined,
      }),
    );

    return {
      events: (response.events ?? []).map((event) => {
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
            objectId: eventProperties.objectId,
            userId: eventProperties.userId,
            textValue: eventProperties.textValue,
          },
        };
      }),
    };
  }

  async logCustomEvent(
    event: AnalyticsProto.CustomEventRequest,
  ): Promise<AnalyticsProto.CustomEventResponse> {
    if (
      !event ||
      !event.category ||
      !event.properties ||
      !event.subcategory ||
      event.category.length === 0 ||
      event.subcategory.length === 0
    ) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message:
          'Invalid CustomEventRequest: category, subcategory, and properties are required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.createAnalyticsEvent({
        projectId: event.configId,
        environment: event.environment,
        type: AnalyticsEventProto.AnalyticsEventType.CUSTOM,
        category: event.category,
        subcategory: event.subcategory,
        properties: JSON.stringify(event.properties),
      }),
    );

    const properties = JSON.parse(response.properties);

    return {
      id: String(response.id),
      // Must match the id db-service generates in getCustomEventTypes, since the
      // dash joins custom events to their type by eventTypeId.
      eventTypeId: `${response.projectId}-${response.category}-${response.subcategory}`,
      projectId: String(response.projectId),
      environment: response.environment,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      properties: Object.fromEntries(
        Object.entries(properties).map(([k, v]) => [k, String(v)]),
      ),
    };
  }

  async getCustomEventsPaginated(
    request: AnalyticsProto.GetCustomEventsRequest,
  ): Promise<AnalyticsProto.GetCustomEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetCustomEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAnalyticsEventsPaginated({
        projectId: request.configId,
        environment: request.environment,
        type: AnalyticsEventProto.AnalyticsEventType.CUSTOM,
        afterId: request.afterId || undefined,
        limit: request.limit || undefined,
        afterTime: request.afterTime || undefined,
        category: request.category || undefined,
        subcategory: request.subcategory || undefined,
      }),
    );

    return {
      events: (response.events ?? []).map((event) => {
        const properties = JSON.parse(event.properties);
        return {
          id: String(event.id),
          eventTypeId: `${event.projectId}-${event.category}-${event.subcategory}`,
          projectId: String(event.projectId),
          environment: event.environment,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          properties: Object.fromEntries(
            Object.entries(properties).map(([k, v]) => [k, String(v)]),
          ),
        };
      }),
      afterId: response.afterId,
    };
  }

  async getAllCustomEvents(
    request: AnalyticsProto.GetAllCustomEventsRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventsResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllCustomEventsRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getAllAnalyticsEvents({
        projectId: request.configId,
        type: AnalyticsEventProto.AnalyticsEventType.CUSTOM,
        afterTime: request.afterTime || undefined,
        limit: request.limit || undefined,
        category: request.category || undefined,
        subcategory: request.subcategory || undefined,
      }),
    );

    return {
      events: (response.events ?? []).map((event) => {
        const properties = JSON.parse(event.properties);
        return {
          id: String(event.id),
          eventTypeId: `${event.projectId}-${event.category}-${event.subcategory}`,
          projectId: String(event.projectId),
          environment: event.environment,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          properties: Object.fromEntries(
            Object.entries(properties).map(([k, v]) => [k, String(v)]),
          ),
        };
      }),
    };
  }

  async getCustomEventTypes(
    request: AnalyticsProto.CustomEventTypeRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventTypeResponse> {
    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid CustomEventTypeRequest: projectName is required',
      });
    }

    const response = await lastValueFrom(
      this.analyticsEventDbService.getCustomEventTypes({
        projectId: request.configId,
      }),
    );

    return {
      eventTypes: (response.eventTypes ?? []).map((eventType) => ({
        id: eventType.id,
        category: eventType.category,
        subcategory: eventType.subcategory,
        properties: [...(eventType.properties ?? [])],
        projectId: eventType.projectId,
      })),
    };
  }

  async getCustomGraphTypesById(
    _request: AnalyticsProto.CustomGraphTypeRequest,
  ): Promise<AnalyticsProto.CustomGraphTypeResponse> {
    return { graphs: [] };
  }
}
