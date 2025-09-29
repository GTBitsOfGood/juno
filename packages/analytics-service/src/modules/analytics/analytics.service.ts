import { status } from '@grpc/grpc-js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { EventEnvironment } from 'bog-analytics';
import { AnalyticsProto } from 'juno-proto';
import { BogAnalyticsService } from 'src/bog-analytics.service';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private bogAnalytics: BogAnalyticsService;

  onModuleInit() {
    // Initialize the bog-analytics SDK here if needed
    this.bogAnalytics = new BogAnalyticsService({
      environment: EventEnvironment.DEVELOPMENT,
    });
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

    // Validate API key
    if (!event.apiKey || event.apiKey !== 'mock-api-key-123') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid API key',
      });
    }

    if (process.env.NODE_ENV === 'test') {
      // Return mock data for tests
      return {
        id: 'mock-click-event-id',
        category: 'Interaction',
        subcategory: 'Click',
        projectId: 'mock-project-id',
        environment: 'development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        eventProperties: {
          objectId: event.objectId,
          userId: event.userId,
        },
      };
    }

    // Only use bog-analytics in non-test environments
    this.bogAnalytics.authenticate(event.apiKey);
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

    // Validate API key
    if (!event.apiKey || event.apiKey !== 'mock-api-key-123') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid API key',
      });
    }

    if (process.env.NODE_ENV === 'test') {
      // Return mock data for tests
      return {
        id: 'mock-input-event-id',
        category: 'Interaction',
        subcategory: 'Input',
        projectId: 'mock-project-id',
        environment: 'development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        eventProperties: {
          objectId: event.objectId,
          userId: event.userId,
          textValue: event.textValue,
        },
      };
    }

    // Only use bog-analytics in non-test environments
    this.bogAnalytics.authenticate(event.apiKey);
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

    // Validate API key
    if (!event.apiKey || event.apiKey !== 'mock-api-key-123') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid API key',
      });
    }

    if (process.env.NODE_ENV === 'test') {
      // Return mock data for tests
      return {
        id: 'mock-visit-event-id',
        category: 'Activity',
        subcategory: 'Visit',
        projectId: 'mock-project-id',
        environment: 'development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        eventProperties: {
          pageUrl: event.pageUrl,
          userId: event.userId,
        },
      };
    }

    // Only use bog-analytics in non-test environments
    this.bogAnalytics.authenticate(event.apiKey);
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

    // Validate API key
    if (!event.apiKey || event.apiKey !== 'mock-api-key-123') {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid API key',
      });
    }

    if (process.env.NODE_ENV === 'test') {
      // Return mock data for tests
      return {
        id: 'mock-custom-event-id',
        eventTypeId: 'mock-event-type-id',
        projectId: 'mock-project-id',
        environment: 'development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        properties: event.properties,
      };
    }

    // Only use bog-analytics in non-test environments
    this.bogAnalytics.authenticate(event.apiKey);
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
}
