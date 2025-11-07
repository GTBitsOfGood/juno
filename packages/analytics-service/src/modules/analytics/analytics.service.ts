import { status } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { AnalyticsConfigProto, AnalyticsProto } from 'juno-proto';
import { lastValueFrom } from 'rxjs';
import { ANALYTICS_CONFIG_DB_SERVICE_NAME } from 'juno-proto/dist/gen/analytics_config';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private analyticsService: AnalyticsConfigProto.AnalyticsConfigDbServiceClient;

  private AnalyticsLogger: any;
  private AnalyticsViewer: any;
  private EventEnvironment: any;

  constructor(
    @Inject(ANALYTICS_CONFIG_DB_SERVICE_NAME)
    private analyticsClient: ClientGrpc,
  ) {}

  async onModuleInit() {
    this.analyticsService =
      this.analyticsClient.getService<AnalyticsConfigProto.AnalyticsConfigDbServiceClient>(
        ANALYTICS_CONFIG_DB_SERVICE_NAME,
      );

    // bog-analytics is absolutely cursed and outdated, have to do some shenanigans
    // to get around ESM import
    const loadModule = eval('(specifier) => import(specifier)');
    const bogAnalytics = await loadModule('bog-analytics');

    this.AnalyticsLogger = bogAnalytics.AnalyticsLogger;
    this.AnalyticsViewer = bogAnalytics.AnalyticsViewer;
    this.EventEnvironment = bogAnalytics.EventEnvironment;
  }

  // bog-analytics currently doesn't allow stateless requests with passing in a key,
  // so we have to compromise by re-instantiating the object each time
  async getAnalyticsViewer(
    analyticsEnvironment: any,
    configId: number,
    junoEnvironment: string,
  ) {
    const config = await lastValueFrom(
      this.analyticsService.readAnalyticsConfig({
        id: configId,
        environment: junoEnvironment,
      }),
    );

    const viewer = new this.AnalyticsViewer({
      apiBaseUrl: process.env.BOG_ANALYTICS_BASE_URL,
      environment: analyticsEnvironment,
    });

    try {
      viewer.authenticate(config.serverAnalyticsKey);
    } catch (e) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid API key',
      });
    }

    return viewer;
  }

  async getAnalyticsLogger(
    analyticsEnvironment: any,
    configId: number,
    junoEnvironment: string,
  ) {
    const config = await lastValueFrom(
      this.analyticsService.readAnalyticsConfig({
        id: configId,
        environment: junoEnvironment,
      }),
    );

    const viewer = new this.AnalyticsLogger({
      apiBaseUrl: process.env.BOG_ANALYTICS_BASE_URL,
      environment: analyticsEnvironment,
    });

    try {
      viewer.authenticate(config.clientAnalyticsKey);
    } catch (e) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid API key',
      });
    }

    return viewer;
  }

  async logClickEvent(
    event: AnalyticsProto.ClickEventRequest,
  ): Promise<AnalyticsProto.ClickEventResponse> {
    const logger = await this.getAnalyticsLogger(
      this.EventEnvironment.DEVELOPMENT,
      event.configId,
      event.configEnvironment,
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

    const response = await logger.logClickEvent(event);

    if (!response) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid analytics configuration',
      });
    }

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
    // TODO: we need to allow bog-analytics specific environments
    const logger = await this.getAnalyticsLogger(
      this.EventEnvironment.DEVELOPMENT,
      event.configId,
      event.configEnvironment,
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

    const response = await logger.logInputEvent(event);

    if (!response) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid analytics configuration',
      });
    }

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
    // TODO: we need to allow environments
    const logger = await this.getAnalyticsLogger(
      this.EventEnvironment.DEVELOPMENT,
      event.configId,
      event.configEnvironment,
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

    const response = await logger.logVisitEvent(event);

    if (!response) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid analytics configuration',
      });
    }

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
    // TODO: we need to allow environments
    const logger = await this.getAnalyticsLogger(
      this.EventEnvironment.DEVELOPMENT,
      event.configId,
      event.configEnvironment,
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
    let response;
    try {
      response = await logger.logCustomEvent(category, subcategory, properties);
    } catch (error: any) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Failed to log custom event: ${error?.message || error?.toString() || 'Unknown error'}..`,
      });
    }

    if (!response) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: `Invalid analytics configuration for custom event: ${category} ${subcategory}`,
      });
    }

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

  async getCustomEventTypes(
    request: AnalyticsProto.CustomEventTypeRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventTypeResponse> {
    // TODO: environments
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

    if (!request.projectName || request.projectName.length === 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid CustomEventTypeRequest: projectName is required',
      });
    }

    const response = await viewer.getCustomEventTypes(request.projectName);

    if (!response || response.length === 0) {
      return {
        eventTypes: [],
      };
    }

    return {
      eventTypes: response.map((eventType) => ({
        id: eventType._id,
        category: eventType.category,
        subcategory: eventType.subcategory,
        properties: [...eventType.properties],
        projectId: eventType.projectId,
      })),
    };
  }

  async getCustomGraphTypesById(
    request: AnalyticsProto.CustomGraphTypeRequest,
  ): Promise<AnalyticsProto.CustomGraphTypeResponse> {
    // TODO: environments
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getCustomGraphTypesById(
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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getClickEventsPaginated(queryParams);

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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getAllClickEvents(
      request.projectName,
      afterTime,
      limit,
    );

    if (!response) {
      return { events: [] };
    }

    return {
      events: response.map((event: any) => ({
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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getVisitEventsPaginated(queryParams);
    if (!response) {
      return { events: [], afterId: '' };
    }

    return {
      events: response.events.map((event: any) => ({
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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getAllVisitEvents(
      request.projectName,
      afterTime,
      limit,
    );

    if (!response) {
      return { events: [] };
    }

    return {
      events: response.map((event: any) => ({
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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getInputEventsPaginated(queryParams);

    if (!response) {
      return { events: [], afterId: '' };
    }

    return {
      events: response.events.map((event: any) => ({
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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getAllInputEvents(
      request.projectName,
      afterTime,
      limit,
    );

    if (!response) {
      return { events: [] };
    }

    return {
      events: response.map((event: any) => ({
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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getCustomEventsPaginated(queryParams);

    if (!response) {
      return { events: [], afterId: '' };
    }

    return {
      events: response.events.map((event: any) => ({
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
    const viewer = await this.getAnalyticsViewer(
      this.EventEnvironment.DEVELOPMENT,
      request.configId,
      request.configEnvironment,
    );

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

    const response = await viewer.getAllCustomEvents(
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
      events: response.map((event: any) => ({
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
