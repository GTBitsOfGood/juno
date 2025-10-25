import { Injectable } from '@nestjs/common';
import {
  AnalyticsViewer,
  AnalyticsLogger as BogAnalyticsLogger,
} from 'bog-analytics';

@Injectable()
export class BogAnalyticsService extends BogAnalyticsLogger {}

@Injectable()
export class AnalyticsViewerService extends AnalyticsViewer {}
