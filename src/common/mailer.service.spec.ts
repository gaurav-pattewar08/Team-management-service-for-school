import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { readFileSync } from 'fs';
import { join } from 'path';

// Create a single mock transporter that will be reused
const mockSendMail = jest.fn();
const mockTransporter = {
  sendMail: mockSendMail,
};

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('MailerService', () => {
  let service: MailerService;
  let nodemailer: any;

  beforeEach(async () => {
    nodemailer = require('nodemailer');
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService],
    }).compile();

    service = module.get<MailerService>(MailerService);

    // Setup environment variables
    process.env.OUTLOOK_EMAIL = 'test@outlook.com';
    process.env.OUTLOOK_PASSWORD = 'test-password';
  });

  afterEach(() => {
    delete process.env.OUTLOOK_EMAIL;
    delete process.env.OUTLOOK_PASSWORD;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendTemplateMail', () => {
    it('should successfully send template email', async () => {
      const mockHtml = '<p>Hello {{name}}</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({ messageId: 'test-123' });

      const result = await service.sendTemplateMail(
        'recipient@test.com',
        'Test Subject',
        'verify-email',
        { name: 'John' },
      );

      expect(readFileSync).toHaveBeenCalledWith(
        join(process.cwd(), 'src', 'email-templates', 'verify-email.html'),
        'utf8',
      );
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"IPL App" <test@outlook.com>',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Hello John</p>',
      });
      expect(result).toEqual({ messageId: 'test-123' });
    });

    it('should replace multiple placeholders in template', async () => {
      const mockHtml = '<p>Hello {{name}}, your code is {{code}}</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({ messageId: 'test-456' });

      await service.sendTemplateMail(
        'user@test.com',
        'Verification',
        'verify-email',
        { name: 'John', code: '123456' },
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"IPL App" <test@outlook.com>',
        to: 'user@test.com',
        subject: 'Verification',
        html: '<p>Hello John, your code is 123456</p>',
      });
    });

    it('should handle whitespace in placeholders', async () => {
      const mockHtml = '<p>{{  name  }}</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({ messageId: 'test-789' });

      await service.sendTemplateMail(
        'user@test.com',
        'Test',
        'template',
        { name: 'John' },
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"IPL App" <test@outlook.com>',
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>John</p>',
      });
    });

    it('should replace same placeholder multiple times', async () => {
      const mockHtml = '<p>{{name}} and {{name}} are the same</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({ messageId: 'test-101' });

      await service.sendTemplateMail(
        'user@test.com',
        'Duplicate',
        'template',
        { name: 'Value' },
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"IPL App" <test@outlook.com>',
        to: 'user@test.com',
        subject: 'Duplicate',
        html: '<p>Value and Value are the same</p>',
      });
    });

    it('should handle template with no placeholders', async () => {
      const mockHtml = '<p>Static content</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({ messageId: 'static-123' });

      await service.sendTemplateMail(
        'user@test.com',
        'Static',
        'template',
        {},
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"IPL App" <test@outlook.com>',
        to: 'user@test.com',
        subject: 'Static',
        html: '<p>Static content</p>',
      });
    });


    it('should handle nodemailer send error', async () => {
      const mockHtml = '<p>Test</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      const error = new Error('SMTP Error');
      mockSendMail.mockRejectedValue(error);

      await expect(
        service.sendTemplateMail(
          'user@test.com',
          'Error Test',
          'template',
          {},
        ),
      ).rejects.toThrow('SMTP Error');
    });

    it('should handle file read error', async () => {
      const error = new Error('File not found');
      (readFileSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(
        service.sendTemplateMail(
          'user@test.com',
          'Error',
          'nonexistent',
          {},
        ),
      ).rejects.toThrow('File not found');
    });

    it('should use correct from address with environment variable', async () => {
      process.env.OUTLOOK_EMAIL = 'custom@outlook.com';
      
      const mockHtml = '<p>Test</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({ messageId: 'env-test' });

      await service.sendTemplateMail(
        'user@test.com',
        'Test',
        'template',
        {},
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"IPL App" <custom@outlook.com>',
        }),
      );

      delete process.env.OUTLOOK_EMAIL;
    });
  });

  describe('getTemplate', () => {
    it('should read and process template correctly', async () => {
      const mockHtml = '<p>Hello {{name}}</p>';
      (readFileSync as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({ messageId: 'test' });

      await service.sendTemplateMail(
        'user@test.com',
        'Test',
        'verify-email',
        { name: 'John' },
      );

      expect(readFileSync).toHaveBeenCalledWith(
        join(process.cwd(), 'src', 'email-templates', 'verify-email.html'),
        'utf8',
      );
    });
  });
});
