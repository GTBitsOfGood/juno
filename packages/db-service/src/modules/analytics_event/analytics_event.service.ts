import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AnalyticsEvent, AnalyticsEventType, Prisma } from '@prisma/client';
import { AnalyticsEventProto } from 'juno-proto';

@Injectable()
export class AnalyticsEventService {
  constructor(private prisma: PrismaService) {}

  private mapProtoTypeToPrisma(
    type: AnalyticsEventProto.AnalyticsEventType,
  ): AnalyticsEventType {
    switch (type) {
      case AnalyticsEventProto.AnalyticsEventType.CLICK:
        return AnalyticsEventType.CLICK;
      case AnalyticsEventProto.AnalyticsEventType.VISIT:
        return AnalyticsEventType.VISIT;
      case AnalyticsEventProto.AnalyticsEventType.INPUT:
        return AnalyticsEventType.INPUT;
      case AnalyticsEventProto.AnalyticsEventType.CUSTOM:
        return AnalyticsEventType.CUSTOM;
      default:
        throw new Error(`Unknown event type: ${type}`);
    }
  }

  async createAnalyticsEvent(
    data: AnalyticsEventProto.CreateAnalyticsEventRequest,
  ): Promise<AnalyticsEvent> {
    return this.prisma.analyticsEvent.create({
      data: {
        projectId: Number(data.projectId),
        environment: data.environment,
        type: this.mapProtoTypeToPrisma(data.type),
        category: data.category,
        subcategory: data.subcategory,
        properties: data.properties ? JSON.parse(data.properties) : {},
      },
    });
  }

  async getAnalyticsEventsPaginated(
    req: AnalyticsEventProto.GetAnalyticsEventsRequest,
  ): Promise<{ events: AnalyticsEvent[]; afterId: string }> {
    const limit = req.limit || 50;
    const type = this.mapProtoTypeToPrisma(req.type);

    const where: Prisma.AnalyticsEventWhereInput = {
      projectId: Number(req.projectId),
      environment: req.environment,
      type,
    };

    if (req.category) {
      where.category = req.category;
    }
    if (req.subcategory) {
      where.subcategory = req.subcategory;
    }

    if (req.afterId) {
      const afterEvent = await this.prisma.analyticsEvent.findUnique({
        where: { id: Number(req.afterId) },
      });
      if (afterEvent) {
        where.OR = [
          { createdAt: { lt: afterEvent.createdAt } },
          {
            createdAt: afterEvent.createdAt,
            id: { lt: afterEvent.id },
          },
        ];
      }
    }

    if (req.afterTime) {
      const afterTimeDate = new Date(req.afterTime);
      if (where.OR) {
        where.AND = [{ createdAt: { gte: afterTimeDate } }];
      } else {
        where.createdAt = { gte: afterTimeDate };
      }
    }

    const events = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    const afterId =
      events.length > 0 ? String(events[events.length - 1].id) : '';

    return { events, afterId };
  }

  async getAllAnalyticsEvents(
    req: AnalyticsEventProto.GetAllAnalyticsEventsRequest,
  ): Promise<AnalyticsEvent[]> {
    const limit = req.limit || 1000;
    const type = this.mapProtoTypeToPrisma(req.type);

    const where: Prisma.AnalyticsEventWhereInput = {
      projectId: Number(req.projectId),
      type,
    };

    if (req.category) {
      where.category = req.category;
    }
    if (req.subcategory) {
      where.subcategory = req.subcategory;
    }

    if (req.afterTime) {
      where.createdAt = { gte: new Date(req.afterTime) };
    }

    return this.prisma.analyticsEvent.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  async getCustomEventTypes(
    projectId: number,
  ): Promise<
    { category: string; subcategory: string; properties: string[] }[]
  > {
    const distinctEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        projectId,
        type: AnalyticsEventType.CUSTOM,
      },
      distinct: ['category', 'subcategory'],
      select: {
        category: true,
        subcategory: true,
        properties: true,
      },
    });

    return distinctEvents.map((event) => {
      const props = event.properties as Record<string, unknown>;
      return {
        category: event.category,
        subcategory: event.subcategory,
        properties: Object.keys(props),
      };
    });
  }
}
