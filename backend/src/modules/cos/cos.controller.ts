import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from "@nestjs/common";
import { CosService } from "./cos.service";
import { ApiCosTypes, getKey, JwtPayload, UserType } from "@yisu/shared";
import { User } from "@/utils/decorators/user.decorator";
import path from "path/posix";

@Controller('cos')
export class CosController {
  private readonly logger = new Logger(CosController.name);
  constructor(private readonly cosService: CosService) {}

  @Post('generate-presigned-url')
  @HttpCode(HttpStatus.OK)
  generatePresignedUrl(@Body() body: ApiCosTypes['GeneratePresignedUrl'], @User() user: JwtPayload) {
    const key = this.cosService.buildStorageKey({
      prefix: path.join(user.uid, getKey(UserType, user.userType), body.dir),
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