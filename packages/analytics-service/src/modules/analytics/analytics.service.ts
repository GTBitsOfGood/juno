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
}
