import { status } from '@grpc/grpc-js';
import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AnalyticsProto } from 'juno-proto';
import { AnalyticsConfigService } from '../analytics_config/analytics_config.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject('BOG_ANALYTICS') private readonly bogAnalytics: any,
    private readonly analyticsConfigService: AnalyticsConfigService,

    @Inject('ANALYTICS_VIEWER') private readonly analyticsViewer: any,
    private readonly analyticsConfigService: AnalyticsConfigService,
  ) {}

  async authenticateAnalytics(projectId: number, environment: string) {
    try {
      const key = await this.analyticsConfigService.getAnalyticsKey(
        projectId,
        environment,
      );
      this.bogAnalytics.authenticate(key);
    } catch (e) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid API key or analytics config not found',
      });
    }
  }

  async logClickEvent(
    event: AnalyticsProto.ClickEventRequest,
  ): Promise<AnalyticsProto.ClickEventResponse> {
    await this.authenticateAnalytics(
      Number(event.projectId),
      event.environment,
    );

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

    const response = await this.bogAnalytics.logClickEvent(event);
    return {
      id: response._id,
      category: response.category,
      subcategory: response.subcategory,
      projectId: response.projectId,
      environment: response.environment,
      createdAt:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updatedAt:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      eventProperties: {
        objectId: response.eventProperties.objectId,
        userId: response.eventProperties.userId,
      },
    };
  }

  async logInputEvent(
    event: AnalyticsProto.InputEventRequest,
  ): Promise<AnalyticsProto.InputEventResponse> {
    await this.authenticateAnalytics(
      Number(event.projectId),
      event.environment,
    );

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

    const response = await this.bogAnalytics.logInputEvent(event);
    return {
      id: response._id,
      category: response.category,
      subcategory: response.subcategory,
      projectId: response.projectId,
      environment: response.environment,
      createdAt:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updatedAt:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      eventProperties: {
        objectId: response.eventProperties.objectId,
        userId: response.eventProperties.userId,
        textValue: response.eventProperties.textValue,
      },
    };
  }

  async logVisitEvent(
    event: AnalyticsProto.VisitEventRequest,
  ): Promise<AnalyticsProto.VisitEventResponse> {
    await this.authenticateAnalytics(
      Number(event.projectId),
      event.environment,
    );

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

    const response = await this.bogAnalytics.logVisitEvent(event);
    return {
      id: response._id,
      category: response.category,
      subcategory: response.subcategory,
      projectId: response.projectId,
      environment: response.environment,
      createdAt:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updatedAt:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      eventProperties: {
        pageUrl: response.eventProperties.pageUrl,
        userId: response.eventProperties.userId,
      },
    };
  }

  async logCustomEvent(
    event: AnalyticsProto.CustomEventRequest,
  ): Promise<AnalyticsProto.CustomEventResponse> {
    await this.authenticateAnalytics(
      Number(event.projectId),
      event.environment,
    );

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

    const { category, subcategory, properties } = event;
    const response = await this.bogAnalytics.logCustomEvent(
      category,
      subcategory,
      properties,
    );
    return {
      id: response._id,
      eventTypeId: response.eventTypeId,
      projectId: response.projectId,
      environment: response.environment,
      createdAt:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updatedAt:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      properties: Object.fromEntries(
        Object.entries(response.properties).map(([k, v]) => [k, String(v)]),
      ),
    };
  }

  authenticateViewer(key: string) {
    try {
      this.analyticsViewer.authenticate(key);
    } catch (e) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid API key',
      });
    }
  }

  async getCustomEventTypes(
    request: AnalyticsProto.CustomEventTypeRequest,
  ): Promise<AnalyticsProto.CustomEventTypeResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid CustomEventTypeRequest: projectName is required',
      });
    }

    const response = await this.analyticsViewer.getCustomEventTypes(
      request.projectName,
    );

    if (!response || response.length === 0) {
      return {
        id: '',
        category: '',
        subcategory: '',
        properties: [],
        projectId: '',
      };
    }

    // Return the first custom event type for now
    const eventType = response[0];
    return {
      id: eventType._id || '',
      category: eventType.category,
      subcategory: eventType.subcategory,
      properties: eventType.properties,
      projectId: eventType.projectId,
    };
  }

  async getCustomGraphTypesById(
    request: AnalyticsProto.CustomGraphTypeRequest,
  ): Promise<AnalyticsProto.CustomGraphTypeResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid CustomGraphTypeRequest: projectName is required',
      });
    }

    if (!request.eventTypeId || request.eventTypeId.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid CustomGraphTypeRequest: eventTypeId is required',
      });
    }

    const response = await this.analyticsViewer.getCustomGraphTypesbyId(
      request.projectName,
      request.eventTypeId,
    );

    if (!response) {
      return { graphs: [] };
    }

    return {
      graphs: response.map((graph) => ({
        id: graph._id,
        eventTypeId: graph.eventTypeId,
        projectId: graph.projectId,
        graphTitle: graph.graphTitle,
        xProperty: graph.xProperty,
        yProperty: graph.yProperty,
        graphType: graph.graphType,
        caption: graph.caption || '',
      })),
    };
  }

  async getClickEventsPaginated(
    request: AnalyticsProto.GetClickEventsRequest,
  ): Promise<AnalyticsProto.GetClickEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetClickEventsRequest: projectName is required',
      });
    }

    const queryParams = {
      projectName: request.projectName,
      afterId: request.afterId || undefined,
      environment: request.environment as any,
      limit: request.limit || undefined,
      afterTime: request.afterTime || undefined,
    };

    const response =
      await this.analyticsViewer.getClickEventsPaginated(queryParams);

    if (!response) {
      return { events: [], afterId: '' };
    }

    return {
      events: response.events.map((event) => ({
        id: event._id,
        category: event.category,
        subcategory: event.subcategory,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        eventProperties: {
          objectId: event.eventProperties.objectId,
          userId: event.eventProperties.userId,
        },
      })),
      afterId: response.afterId,
    };
  }

  async getAllClickEvents(
    request: AnalyticsProto.GetAllClickEventsRequest,
  ): Promise<AnalyticsProto.GetAllClickEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllClickEventsRequest: projectName is required',
      });
    }

    const afterTime = request.afterTime
      ? new Date(request.afterTime)
      : undefined;
    const limit = request.limit || undefined;

    const response = await this.analyticsViewer.getAllClickEvents(
      request.projectName,
      afterTime,
      limit,
    );

    if (!response) {
      return { events: [] };
    }

    return {
      events: response.map((event) => ({
        id: event._id,
        category: event.category,
        subcategory: event.subcategory,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        eventProperties: {
          objectId: event.eventProperties.objectId,
          userId: event.eventProperties.userId,
        },
      })),
    };
  }

  async getVisitEventsPaginated(
    request: AnalyticsProto.GetVisitEventsRequest,
  ): Promise<AnalyticsProto.GetVisitEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetVisitEventsRequest: projectName is required',
      });
    }

    const queryParams = {
      projectName: request.projectName,
      afterId: request.afterId || undefined,
      environment: request.environment as any,
      limit: request.limit || undefined,
      afterTime: request.afterTime || undefined,
    };

    const response =
      await this.analyticsViewer.getVisitEventsPaginated(queryParams);

    if (!response) {
      return { events: [], afterId: '' };
    }

    return {
      events: response.events.map((event) => ({
        id: event._id,
        category: event.category,
        subcategory: event.subcategory,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        eventProperties: {
          pageUrl: event.eventProperties.pageUrl,
          userId: event.eventProperties.userId,
        },
      })),
      afterId: response.afterId,
    };
  }

  async getAllVisitEvents(
    request: AnalyticsProto.GetAllVisitEventsRequest,
  ): Promise<AnalyticsProto.GetAllVisitEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllVisitEventsRequest: projectName is required',
      });
    }

    const afterTime = request.afterTime
      ? new Date(request.afterTime)
      : undefined;
    const limit = request.limit || undefined;

    const response = await this.analyticsViewer.getAllVisitEvents(
      request.projectName,
      afterTime,
      limit,
    );

    if (!response) {
      return { events: [] };
    }

    return {
      events: response.map((event) => ({
        id: event._id,
        category: event.category,
        subcategory: event.subcategory,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        eventProperties: {
          pageUrl: event.eventProperties.pageUrl,
          userId: event.eventProperties.userId,
        },
      })),
    };
  }

  async getInputEventsPaginated(
    request: AnalyticsProto.GetInputEventsRequest,
  ): Promise<AnalyticsProto.GetInputEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetInputEventsRequest: projectName is required',
      });
    }

    const queryParams = {
      projectName: request.projectName,
      afterId: request.afterId || undefined,
      environment: request.environment as any,
      limit: request.limit || undefined,
      afterTime: request.afterTime || undefined,
    };

    const response =
      await this.analyticsViewer.getInputEventsPaginated(queryParams);

    if (!response) {
      return { events: [], afterId: '' };
    }

    return {
      events: response.events.map((event) => ({
        id: event._id,
        category: event.category,
        subcategory: event.subcategory,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        eventProperties: {
          objectId: event.eventProperties.objectId,
          userId: event.eventProperties.userId,
          textValue: event.eventProperties.textValue,
        },
      })),
      afterId: response.afterId,
    };
  }

  async getAllInputEvents(
    request: AnalyticsProto.GetAllInputEventsRequest,
  ): Promise<AnalyticsProto.GetAllInputEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllInputEventsRequest: projectName is required',
      });
    }

    const afterTime = request.afterTime
      ? new Date(request.afterTime)
      : undefined;
    const limit = request.limit || undefined;

    const response = await this.analyticsViewer.getAllInputEvents(
      request.projectName,
      afterTime,
      limit,
    );

    if (!response) {
      return { events: [] };
    }

    return {
      events: response.map((event) => ({
        id: event._id,
        category: event.category,
        subcategory: event.subcategory,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        eventProperties: {
          objectId: event.eventProperties.objectId,
          userId: event.eventProperties.userId,
          textValue: event.eventProperties.textValue,
        },
      })),
    };
  }

  async getCustomEventsPaginated(
    request: AnalyticsProto.GetCustomEventsRequest,
  ): Promise<AnalyticsProto.GetCustomEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetCustomEventsRequest: projectName is required',
      });
    }

    if (!request.category || request.category.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetCustomEventsRequest: category is required',
      });
    }

    if (!request.subcategory || request.subcategory.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetCustomEventsRequest: subcategory is required',
      });
    }

    const queryParams = {
      projectName: request.projectName,
      afterId: request.afterId || undefined,
      environment: request.environment as any,
      limit: request.limit || undefined,
      afterTime: request.afterTime || undefined,
      category: request.category,
      subcategory: request.subcategory,
    };

    const response =
      await this.analyticsViewer.getCustomEventsPaginated(queryParams);

    if (!response) {
      return { events: [], afterId: '' };
    }

    return {
      events: response.events.map((event) => ({
        id: event._id,
        eventTypeId: event.eventTypeId,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        properties: Object.fromEntries(
          Object.entries(event.properties).map(([k, v]) => [k, String(v)]),
        ),
      })),
      afterId: response.afterId,
    };
  }

  async getAllCustomEvents(
    request: AnalyticsProto.GetAllCustomEventsRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventsResponse> {
    this.authenticateViewer(request.apiKey);

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllCustomEventsRequest: projectName is required',
      });
    }

    if (!request.category || request.category.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllCustomEventsRequest: category is required',
      });
    }

    if (!request.subcategory || request.subcategory.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid GetAllCustomEventsRequest: subcategory is required',
      });
    }

    const afterTime = request.afterTime
      ? new Date(request.afterTime)
      : undefined;
    const limit = request.limit || undefined;

    const response = await this.analyticsViewer.getAllCustomEvents(
      request.projectName,
      request.category,
      request.subcategory,
      afterTime,
      limit,
    );

    if (!response) {
      return { events: [] };
    }

    return {
      events: response.map((event) => ({
        id: event._id,
        eventTypeId: event.eventTypeId,
        projectId: event.projectId,
        environment: event.environment,
        createdAt:
          event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : event.createdAt,
        updatedAt:
          event.updatedAt instanceof Date
            ? event.updatedAt.toISOString()
            : event.updatedAt,
        properties: Object.fromEntries(
          Object.entries(event.properties).map(([k, v]) => [k, String(v)]),
        ),
      })),
    };
  }
}
