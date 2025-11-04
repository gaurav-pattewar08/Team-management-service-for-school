import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

// Mock streamifier
jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: ConfigService;
  let mockUploadStream: any;
  let callbackFn: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'test-cloud',
        CLOUDINARY_API_KEY: 'test-api-key',
        CLOUDINARY_API_SECRET: 'test-api-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    // Setup upload_stream mock before creating service
    mockUploadStream = {
      end: jest.fn(),
    };

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (options, callback) => {
        callbackFn = callback;
        return mockUploadStream;
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should configure cloudinary on instantiation', () => {
    // Create a new instance to trigger constructor
    const newService = new CloudinaryService(mockConfigService as any);
    expect(newService).toBeDefined();
    expect(cloudinary.config).toHaveBeenCalled();
  });

  describe('uploadFile', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test-image-data'),
      size: 12345,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    it('should successfully upload file with default folder', async () => {
      // Mock successful upload
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
        public_id: 'test',
        version: 123,
      };

      const streamifier = require('streamifier');
      const mockStream = {
        pipe: jest.fn(),
      };
      streamifier.createReadStream.mockReturnValue(mockStream);

      // Call the callback immediately before awaiting
      const uploadPromise = service.uploadFile(mockFile);
      
      // Simulate the async callback
      setImmediate(() => {
        callbackFn(null, mockResult);
      });

      const result = await uploadPromise;

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'teams', resource_type: 'image' },
        expect.any(Function),
      );
      expect(streamifier.createReadStream).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockStream.pipe).toHaveBeenCalledWith(mockUploadStream);
      expect(result).toBe(mockResult.secure_url);
    });

    it('should successfully upload file with custom folder', async () => {
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/custom/test.jpg',
        public_id: 'custom/test',
        version: 123,
      };

      const streamifier = require('streamifier');
      const mockStream = {
        pipe: jest.fn(),
      };
      streamifier.createReadStream.mockReturnValue(mockStream);

      const uploadPromise = service.uploadFile(mockFile, 'custom-folder');
      setImmediate(() => {
        callbackFn(null, mockResult);
      });

      const result = await uploadPromise;

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'custom-folder', resource_type: 'image' },
        expect.any(Function),
      );
      expect(result).toBe(mockResult.secure_url);
    });

    it('should throw error when file buffer is missing', async () => {
      const fileWithoutBuffer = { ...mockFile, buffer: undefined } as any;

      await expect(service.uploadFile(fileWithoutBuffer)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.uploadFile(fileWithoutBuffer)).rejects.toThrow(
        'File buffer is missing. Ensure Multer is configured with memoryStorage.',
      );
    });

    it('should throw error when file is null', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw error when cloudinary upload fails', async () => {
      const streamifier = require('streamifier');
      const mockStream = {
        pipe: jest.fn(),
      };
      streamifier.createReadStream.mockReturnValue(mockStream);

      const uploadError = new Error('Cloudinary upload failed');

      const uploadPromise = service.uploadFile(mockFile);
      setImmediate(() => {
        callbackFn(uploadError, null);
      });

      await expect(uploadPromise).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(uploadPromise).rejects.toThrow(
        'Cloudinary upload failed',
      );
    });

    it('should throw error when result has no secure_url', async () => {
      const streamifier = require('streamifier');
      const mockStream = {
        pipe: jest.fn(),
      };
      streamifier.createReadStream.mockReturnValue(mockStream);

      const mockResultWithoutUrl = {
        public_id: 'test',
        version: 123,
      };

      const uploadPromise = service.uploadFile(mockFile);
      setImmediate(() => {
        callbackFn(null, mockResultWithoutUrl);
      });

      await expect(uploadPromise).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(uploadPromise).rejects.toThrow('Upload failed');
    });

    it('should handle empty buffer', async () => {
      const fileWithEmptyBuffer = { ...mockFile, buffer: Buffer.from('') };

      const streamifier = require('streamifier');
      const mockStream = {
        pipe: jest.fn(),
      };
      streamifier.createReadStream.mockReturnValue(mockStream);

      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
        public_id: 'test',
        version: 123,
      };

      const uploadPromise = service.uploadFile(fileWithEmptyBuffer);
      setImmediate(() => {
        callbackFn(null, mockResult);
      });

      const result = await uploadPromise;
      expect(result).toBe(mockResult.secure_url);
    });

    it('should handle different file types correctly', async () => {
      const streamifier = require('streamifier');
      const mockStream = {
        pipe: jest.fn(),
      };
      streamifier.createReadStream.mockReturnValue(mockStream);

      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.png',
        public_id: 'test',
        version: 123,
      };

      const uploadPromise = service.uploadFile(mockFile);
      setImmediate(() => {
        callbackFn(null, mockResult);
      });

      const result = await uploadPromise;
      expect(result).toBe(mockResult.secure_url);
    });
  });

  describe('uploadBuffer', () => {
    it('should successfully upload buffer', async () => {
      const buffer = Buffer.from('test-data');
      const mockResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
        public_id: 'test',
        version: 123,
      };

      const streamifier = require('streamifier');
      const mockStream = {
        pipe: jest.fn(),
      };
      streamifier.createReadStream.mockReturnValue(mockStream);

      const uploadPromise = (service as any).uploadBuffer(buffer);
      setImmediate(() => {
        callbackFn(null, mockResult);
      });

      const result = await uploadPromise;
      expect(result).toBe(mockResult.secure_url);
    });
  });
});
