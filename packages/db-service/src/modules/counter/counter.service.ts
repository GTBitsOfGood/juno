import { Injectable } from '@nestjs/common';
import { FileServiceFile } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class CounterService {
    constructor(private prisma: PrismaService) {}
    //incrementCounter, decrementCounter, resetCounter, getCounter
}