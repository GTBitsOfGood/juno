import { Injectable } from '@nestjs/common';
import { AnalyticsLogger as BogAnalyticsLogger } from 'bog-analytics';

@Injectable()
export class BogAnalyticsService extends BogAnalyticsLogger {}
