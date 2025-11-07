import { Controller } from '@nestjs/common';
import { AnalyticsProto } from 'juno-proto';
import { AnalyticsService } from './analytics.service';

@Controller()
@AnalyticsProto.AnalyticsServiceControllerMethods()
export class AnalyticsController
  implements AnalyticsProto.AnalyticsServiceController
{
  constructor(private readonly analyticsService: AnalyticsService) {}

  async logClickEvent(
    request: AnalyticsProto.ClickEventRequest,
  ): Promise<AnalyticsProto.ClickEventResponse> {
    return await this.analyticsService.logClickEvent(request);
  }

  async logVisitEvent(
    request: AnalyticsProto.VisitEventRequest,
  ): Promise<AnalyticsProto.VisitEventResponse> {
    return await this.analyticsService.logVisitEvent(request);
  }

  async logInputEvent(
    request: AnalyticsProto.InputEventRequest,
  ): Promise<AnalyticsProto.InputEventResponse> {
    return await this.analyticsService.logInputEvent(request);
  }

  async logCustomEvent(
    request: AnalyticsProto.CustomEventRequest,
  ): Promise<AnalyticsProto.CustomEventResponse> {
    return await this.analyticsService.logCustomEvent(request);
  }

  async getCustomEventTypes(
    request: AnalyticsProto.CustomEventTypeRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventTypeResponse> {
    return await this.analyticsService.getCustomEventTypes(request);
  }

  async getCustomGraphTypesById(
    request: AnalyticsProto.CustomGraphTypeRequest,
  ): Promise<AnalyticsProto.CustomGraphTypeResponse> {
    return await this.analyticsService.getCustomGraphTypesById(request);
  }

  async getClickEventsPaginated(
    request: AnalyticsProto.GetClickEventsRequest,
  ): Promise<AnalyticsProto.GetClickEventsResponse> {
    return await this.analyticsService.getClickEventsPaginated(request);
  }

  async getAllClickEvents(
    request: AnalyticsProto.GetAllClickEventsRequest,
  ): Promise<AnalyticsProto.GetAllClickEventsResponse> {
    return await this.analyticsService.getAllClickEvents(request);
  }

  async getVisitEventsPaginated(
    request: AnalyticsProto.GetVisitEventsRequest,
  ): Promise<AnalyticsProto.GetVisitEventsResponse> {
    return await this.analyticsService.getVisitEventsPaginated(request);
  }

  async getAllVisitEvents(
    request: AnalyticsProto.GetAllVisitEventsRequest,
  ): Promise<AnalyticsProto.GetAllVisitEventsResponse> {
    return await this.analyticsService.getAllVisitEvents(request);
  }

  async getInputEventsPaginated(
    request: AnalyticsProto.GetInputEventsRequest,
  ): Promise<AnalyticsProto.GetInputEventsResponse> {
    return await this.analyticsService.getInputEventsPaginated(request);
  }

  async getAllInputEvents(
    request: AnalyticsProto.GetAllInputEventsRequest,
  ): Promise<AnalyticsProto.GetAllInputEventsResponse> {
    return await this.analyticsService.getAllInputEvents(request);
  }

  async getCustomEventsPaginated(
    request: AnalyticsProto.GetCustomEventsRequest,
  ): Promise<AnalyticsProto.GetCustomEventsResponse> {
    return await this.analyticsService.getCustomEventsPaginated(request);
  }

  async getAllCustomEvents(
    request: AnalyticsProto.GetAllCustomEventsRequest,
  ): Promise<AnalyticsProto.GetAllCustomEventsResponse> {
    return await this.analyticsService.getAllCustomEvents(request);
  }
}
