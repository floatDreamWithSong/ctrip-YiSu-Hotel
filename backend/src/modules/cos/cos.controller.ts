import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from "@nestjs/common";
import { CosService } from "./cos.service";
import { ApiCosTypes } from "@yisu/shared";
import { User } from "@/utils/decorators/user.decorator";
import { buildStorageKey, joinPath } from "@/utils/path";
import { JwtPayload } from "@/utils/jwt/types";

@Controller('cos')
export class CosController {
  private readonly logger = new Logger(CosController.name);
  constructor(private readonly cosService: CosService) {}

  @Post('generate-presigned-url')
  @HttpCode(HttpStatus.OK)
  generatePresignedUrl(@Body() body: ApiCosTypes['GeneratePresignedUrl'], @User() user: JwtPayload) {
    const key = buildStorageKey({
      prefix: joinPath(user.sub.toString(), user.userType, body.dir),
      ext: body.ext,
    });
    const presignedUrl = this.cosService.generatePresignedUrl(key);
    const accessUrl = this.cosService.getAcccessUrl(key);
    this.logger.log(`generatePresignedUrl: ${key}, presignedUrl: ${presignedUrl}, accessUrl: ${accessUrl}`);
    return {
      presignedUrl,
      accessUrl,
    };
  }
}