import { status } from '@grpc/grpc-js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { EventEnvironment } from 'bog-analytics';
import { AnalyticsProto } from 'juno-proto';
import { BogAnalyticsService } from 'src/analytics.service';

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
    this.bogAnalytics.authenticate('mock-api-key-123');

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
      project_id: response.projectId,
      environment: response.environment,
      created_at:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updated_at:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      event_properties: {
        object_id: response.eventProperties.objectId,
        user_id: response.eventProperties.userId,
      },
    };
  }

  async logInputEvent(
    event: AnalyticsProto.InputEventRequest,
  ): Promise<AnalyticsProto.InputEventResponse> {
    this.bogAnalytics.authenticate('mock-api-key-123');

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
      project_id: response.projectId,
      environment: response.environment,
      created_at:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updated_at:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      event_properties: {
        object_id: response.eventProperties.objectId,
        user_id: response.eventProperties.userId,
        text_value: response.eventProperties.textValue,
      },
    };
  }

  async logVisitEvent(
    event: AnalyticsProto.VisitEventRequest,
  ): Promise<AnalyticsProto.VisitEventResponse> {
    this.bogAnalytics.authenticate('mock-api-key-123');

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
      project_id: response.projectId,
      environment: response.environment,
      created_at:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updated_at:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      event_properties: {
        page_url: response.eventProperties.pageUrl,
        user_id: response.eventProperties.userId,
      },
    };
  }

  async logCustomEvent(
    event: AnalyticsProto.CustomEventRequest,
  ): Promise<AnalyticsProto.CustomEventResponse> {
    this.bogAnalytics.authenticate('mock-api-key-123');

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
      event_type_id: response.eventTypeId,
      project_id: response.projectId,
      environment: response.environment,
      created_at:
        response.createdAt instanceof Date
          ? response.createdAt.toISOString()
          : response.createdAt,
      updated_at:
        response.updatedAt instanceof Date
          ? response.updatedAt.toISOString()
          : response.updatedAt,
      properties: Object.fromEntries(
        Object.entries(response.properties).map(([k, v]) => [k, String(v)]),
      ),
    };
  }
}
