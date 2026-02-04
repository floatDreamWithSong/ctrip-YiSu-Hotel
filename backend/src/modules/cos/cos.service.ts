import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import COS from 'cos-nodejs-sdk-v5';
import { Configurations } from '@/config';
import path from 'node:path';
import { buildStorageKey } from '@/utils/path';

@Injectable()
export class CosService implements OnModuleInit {
  private cos: COS;
  private readonly logger = new Logger(CosService.name);
  private baseParam: Omit<COS.PutObjectAclParams, 'Key'>;
  onModuleInit() {
    this.cos = new COS({
      SecretId: Configurations.COS_SECRET_ID,
      SecretKey: Configurations.COS_SECRET_KEY,
    });
    this.baseParam = {
      Bucket: Configurations.COS_BUCKET,
      Region: Configurations.COS_REGION,
    };
    this.logger.log(this.baseParam);
  }

  async uploadFile(file: Express.Multer.File) {
    const { originalname, buffer } = file;
    const Key = buildStorageKey({
      prefix: 'system',
      serviceType: 'upload',
      fileName: originalname,
      ext: path.extname(originalname),
    });
    const params = {
      ...this.baseParam,
      Key,
      Body: buffer,
    };
    this.logger.log(params);
    const res = await this.cos.putObject(params);
    return res.Location;
  }
  getAcccessUrl(Key: string) {
    return `https://${Configurations.CDN_HOST}/${Key}`;
  }
  generatePresignedUrl(Key: string) {
    return this.cos.getObjectUrl({
      ...this.baseParam,
      Method: 'PUT',
      Sign: true,
      Expires: 600,
      Key,
    })
  }
  async deleteFile(Key: string) {
    const params = {
      ...this.baseParam,
      Key,
    };
    const res = await this.cos.deleteObject(params);
    return res;
  }
  async deleteFileByUrl(fileUrl: string) {
    const urlObj = new URL(fileUrl);
    await this.deleteFile(urlObj.pathname.substring(1));
  }
}
