import { Controller } from '@nestjs/common';
import { exec } from 'child_process';
import { ResetProto } from 'juno-proto';

@Controller()
@ResetProto.DatabaseResetControllerMethods()
export class ResetController implements ResetProto.DatabaseResetController {
  async resetDb(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _request: ResetProto.ResetDbRequest,
  ): Promise<ResetProto.ResetDbResponse> {
    if (process.env['NODE_ENV'] == 'test') {
      await new Promise((resolve) => {
        exec(
          'pnpm prisma migrate reset --force --skip-generate',
          (_, stdout, stderr) => {
            console.log(`reset out: ${stdout}`);
            console.log(`reset err: ${stderr}`);
            resolve(1);
          },
        );
      });
      return {};
    }
  }
}
