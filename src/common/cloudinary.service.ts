import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private async uploadBuffer(buffer: Buffer, folder = 'teams'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error: any, result: UploadApiResponse) => {
          if (error) return reject(new InternalServerErrorException(error.message));
          if (!result?.secure_url) return reject(new InternalServerErrorException('Upload failed'));
          resolve(result.secure_url);
        },
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  async uploadFile(file: Express.Multer.File, folder = 'teams'): Promise<string> {
    if (!file?.buffer) {
      throw new InternalServerErrorException('File buffer is missing. Ensure Multer is configured with memoryStorage.');
    }
    return this.uploadBuffer(file.buffer, folder);
  }
}
