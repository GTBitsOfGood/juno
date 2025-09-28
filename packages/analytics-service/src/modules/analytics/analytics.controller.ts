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
}
