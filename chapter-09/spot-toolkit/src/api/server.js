#!/usr/bin/env node

/**
 * SPOT Web API Server
 * Provides REST API endpoints for all SPOT functionality
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

// Import SPOT components
import { ConfigManager } from '../utils/configManager.js';
import { ErrorHandling } from '../utils/errorHandling.js';
import { Observability } from '../utils/observability.js';
import { Monitoring } from '../utils/monitoring.js';
import { ProviderManager } from '../utils/providerManager.js';
import { TemplateManager } from '../utils/templateManager.js';
import { SPOT } from '../SPOT.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SPOTAPIServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8000;
    this.components = {};
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      // Initialize SPOT components
      await this.initializeComponents();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('🚀 SPOT API Server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SPOT API Server:', error);
      process.exit(1);
    }
  }

  async initializeComponents() {
    // Initialize configuration
    this.components.config = new ConfigManager();
    await this.components.config.initialize();

    // Initialize observability
    this.components.observability = new Observability(
      this.components.config.get('observability', {})
    );

    // Initialize error handling
    this.components.errorHandling = new ErrorHandling(
      this.components.config.get('errorHandling', {})
    );

    // Initialize monitoring
    this.components.monitoring = new Monitoring(
      this.components.config.get('monitoring', {})
    );
    await this.components.monitoring.start();

    // Initialize provider manager
    this.components.providerManager = new ProviderManager(
      this.components.config.get('providers', {}),
      {
        observability: this.components.observability,
        errorHandling: this.components.errorHandling,
      }
    );

    // Initialize template manager
    const templateDir = this.components.config.get(
      'templates.directory',
      './prompts'
    );
    const absoluteTemplateDir = join(process.cwd(), templateDir);
    this.components.templateManager = new TemplateManager(absoluteTemplateDir);

    // Initialize main application
    this.components.spot = new SPOT({
      providerManager: this.components.providerManager,
      templateManager: this.components.templateManager,
      config: this.components.config,
      observability: this.components.observability,
    });
  }

  setupMiddleware() {
    // Security middleware (allow inline styles for web interface)
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      })
    );

    // CORS
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGINS?.split(',') || [
          'http://localhost:3000',
        ],
        credentials: true,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files for web interface
    this.app.use('/static', express.static(join(__dirname, 'views')));

    // Swagger API documentation
    const swaggerOptions = {
      definition: {
        openapi: '3.1.0',
        info: {
          title: 'SPOT Toolkit API',
          version: '0.4.0',
          description:
            'RESTful API for the SPOT (Structured Prompt Output Toolkit) content generation system',
          contact: {
            name: 'Chris Minnick',
            url: 'https://github.com/chrisminnick/spot-toolkit',
          },
          license: {
            name: 'MIT',
            url: 'https://github.com/chrisminnick/spot-toolkit/blob/main/LICENSE',
          },
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Local development server',
          },
        ],
        components: {
          schemas: {
            HealthResponse: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                timestamp: { type: 'string', format: 'date-time' },
                checks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      status: { type: 'string' },
                      duration: { type: 'number' },
                      details: { type: 'object' },
                    },
                  },
                },
              },
            },
            ScaffoldRequest: {
              type: 'object',
              required: ['asset_type', 'topic', 'audience', 'tone'],
              properties: {
                asset_type: { type: 'string', example: 'blog post' },
                topic: { type: 'string', example: 'AI applications' },
                audience: { type: 'string', example: 'developers' },
                tone: { type: 'string', example: 'technical' },
                word_count: { type: 'integer', default: 600 },
              },
            },
            Error: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string' },
              },
            },
          },
        },
      },
      apis: ['./src/api/server.js'], // Path to the API docs
    };

    const specs = swaggerJsdoc(swaggerOptions);
    this.app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'SPOT Toolkit API Documentation',
      })
    );

    // Request logging
    this.app.use((req, res, next) => {
      this.components.observability.info('API Request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  setupRoutes() {
    // Web interface
    this.app.get('/', this.handleWebInterface.bind(this));

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: System health check
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: System is healthy
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthResponse'
     *       503:
     *         description: System is unhealthy
     */
    this.app.get('/health', this.handleHealth.bind(this));

    /**
     * @swagger
     * /api/v1/info:
     *   get:
     *     summary: API information
     *     tags: [System]
     *     responses:
     *       200:
     *         description: API information
     */
    this.app.get('/api/v1/info', this.handleInfo.bind(this));

    // Template endpoints
    this.app.get('/api/v1/templates', this.handleListTemplates.bind(this));
    this.app.get(
      '/api/v1/templates/:templateId',
      this.handleGetTemplate.bind(this)
    );
    this.app.post(
      '/api/v1/templates/validate',
      this.handleValidateTemplates.bind(this)
    );

    // Provider endpoints
    this.app.get('/api/v1/providers', this.handleListProviders.bind(this));
    this.app.get(
      '/api/v1/providers/:providerId/health',
      this.handleProviderHealth.bind(this)
    );

    // Generation endpoints
    this.app.post('/api/v1/generate', this.handleGenerate.bind(this));

    /**
     * @swagger
     * /api/v1/scaffold:
     *   post:
     *     summary: Create content scaffold
     *     tags: [Generation]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ScaffoldRequest'
     *     responses:
     *       200:
     *         description: Scaffold created successfully
     *       400:
     *         description: Invalid request parameters
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.app.post('/api/v1/scaffold', this.handleScaffold.bind(this));
    this.app.post('/api/v1/expand', this.handleExpand.bind(this));
    this.app.post('/api/v1/rewrite', this.handleRewrite.bind(this));
    this.app.post('/api/v1/summarize', this.handleSummarize.bind(this));
    this.app.post('/api/v1/repurpose', this.handleRepurpose.bind(this));

    // Evaluation endpoints
    this.app.post('/api/v1/evaluate', this.handleEvaluate.bind(this));
    this.app.post('/api/v1/evaluate/file', this.handleEvaluateFile.bind(this));

    // Style checking endpoints
    this.app.post('/api/v1/style/check', this.handleStyleCheck.bind(this));
    this.app.get('/api/v1/style/rules', this.handleGetStyleRules.bind(this));

    // File management endpoints
    this.app.get('/api/v1/files', this.handleListFiles.bind(this));
    this.app.post('/api/v1/files/upload', this.handleUploadFile.bind(this));

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  setupErrorHandling() {
    this.app.use((error, req, res, next) => {
      this.components.observability.error('API Error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
      });

      const statusCode = error.statusCode || error.status || 500;
      const message = error.message || 'Internal server error';

      res.status(statusCode).json({
        error: message,
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    });
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
        // Stop accepting new connections
        this.server.close(() => {
          console.log('✅ HTTP server closed');
        });

        // Stop monitoring
        if (this.components.monitoring) {
          await this.components.monitoring.stop();
        }

        // Close provider connections
        if (
          this.components.providerManager &&
          this.components.providerManager.cleanup
        ) {
          await this.components.providerManager.cleanup();
        }

        console.log('✅ SPOT API Server shut down successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  // Route handlers
  async handleWebInterface(req, res) {
    try {
      const htmlContent = await fs.readFile(
        join(__dirname, 'views', 'index.html'),
        'utf8'
      );
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load web interface',
        message: error.message,
      });
    }
  }

  async handleHealth(req, res) {
    try {
      const health = await this.components.monitoring.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async handleInfo(req, res) {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(join(__dirname, '../../package.json'), 'utf8')
      );

      res.json({
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        environment: process.env.NODE_ENV || 'development',
        provider: process.env.PROVIDER || 'openai',
        features: [
          'Multi-Provider AI Support',
          'Template Management',
          'Content Generation',
          'Style Governance',
          'Evaluation Framework',
        ],
        endpoints: {
          health: '/health',
          templates: '/api/v1/templates',
          providers: '/api/v1/providers',
          generate: '/api/v1/generate',
          evaluate: '/api/v1/evaluate',
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleListTemplates(req, res) {
    try {
      const templates = await this.components.templateManager.listTemplates();
      res.json({ templates });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleGetTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const template = await this.components.templateManager.getTemplate(
        templateId
      );

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ template });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleValidateTemplates(req, res) {
    try {
      const validation =
        await this.components.templateManager.validateAllTemplates();
      const hasErrors = validation.some(
        (result) => result.status === 'invalid'
      );

      res.status(hasErrors ? 400 : 200).json({
        validation,
        summary: {
          total: validation.length,
          valid: validation.filter((r) => r.status === 'valid').length,
          invalid: validation.filter((r) => r.status === 'invalid').length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleListProviders(req, res) {
    try {
      const providers =
        await this.components.providerManager.getAvailableProviders();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleProviderHealth(req, res) {
    try {
      const { providerId } = req.params;
      const health = await this.components.providerManager.checkProviderHealth(
        providerId
      );

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleGenerate(req, res) {
    try {
      const { template, content, provider, options = {} } = req.body;

      if (!template || !content) {
        return res.status(400).json({
          error: 'Template and content are required',
        });
      }

      const result = await this.components.spot.generate({
        template,
        content,
        provider,
        ...options,
      });

      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleScaffold(req, res) {
    try {
      const { asset_type, topic, audience, tone, word_count = 600 } = req.body;

      if (!asset_type || !topic || !audience || !tone) {
        return res.status(400).json({
          error: 'asset_type, topic, audience, and tone are required',
        });
      }

      const result = await this.components.spot.generate({
        template: 'draft_scaffold@1.0.0',
        content: { asset_type, topic, audience, tone, word_count },
      });

      res.json({ scaffold: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleExpand(req, res) {
    try {
      const { section_json } = req.body;

      if (!section_json) {
        return res.status(400).json({
          error: 'section_json is required',
        });
      }

      const result = await this.components.spot.generate({
        template: 'section_expand@1.0.0',
        content: { section_json },
      });

      res.json({ expanded: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleRewrite(req, res) {
    try {
      const {
        text,
        audience,
        tone,
        grade_level,
        words,
        locale = 'en-US',
      } = req.body;

      if (!text || !audience || !tone) {
        return res.status(400).json({
          error: 'text, audience, and tone are required',
        });
      }

      const result = await this.components.spot.generate({
        template: 'rewrite_localize@1.0.0',
        content: { text, audience, tone, grade_level, words, locale },
      });

      res.json({ rewritten: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleSummarize(req, res) {
    try {
      const { content, mode = 'standard' } = req.body;

      if (!content) {
        return res.status(400).json({
          error: 'content is required',
        });
      }

      const result = await this.components.spot.generate({
        template: 'summarize_grounded@1.0.0',
        content: { content, mode },
      });

      res.json({ summary: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleRepurpose(req, res) {
    try {
      const { content, channels = ['email', 'social', 'blog'] } = req.body;

      if (!content) {
        return res.status(400).json({
          error: 'content is required',
        });
      }

      const result = await this.components.spot.generate({
        template: 'repurpose_pack@1.0.0',
        content: { content, channels },
      });

      res.json({ repurposed: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleEvaluate(req, res) {
    try {
      const { template, options = {} } = req.body;

      const results = await this.components.spot.evaluate({
        template,
        ...options,
      });

      res.json({ evaluation: results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleEvaluateFile(req, res) {
    try {
      const { filePath, operation } = req.body;

      if (!filePath || !operation) {
        return res.status(400).json({
          error: 'filePath and operation are required',
        });
      }

      // Implementation would depend on your evaluation framework
      const results = {
        file: filePath,
        operation,
        status: 'evaluated',
        timestamp: new Date().toISOString(),
      };

      res.json({ evaluation: results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleStyleCheck(req, res) {
    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          error: 'content is required',
        });
      }

      // Load style pack
      const stylePack = JSON.parse(
        await fs.readFile(join(__dirname, '../../style/stylepack.json'), 'utf8')
      );

      // Basic style checking (you can expand this)
      const violations = [];
      const mustAvoid = stylePack.must_avoid || [];

      for (const term of mustAvoid) {
        if (content.toLowerCase().includes(term.toLowerCase())) {
          violations.push({
            type: 'must_avoid',
            term,
            message: `Content contains prohibited term: "${term}"`,
          });
        }
      }

      res.json({
        violations,
        compliant: violations.length === 0,
        stylepack: stylePack,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleGetStyleRules(req, res) {
    try {
      const stylePack = JSON.parse(
        await fs.readFile(join(__dirname, '../../style/stylepack.json'), 'utf8')
      );

      res.json({ stylepack: stylePack });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleListFiles(req, res) {
    try {
      const { directory = 'my_content' } = req.query;
      const basePath = join(__dirname, '../../', directory);

      try {
        const files = await fs.readdir(basePath);
        const fileList = [];

        for (const file of files) {
          const filePath = join(basePath, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            fileList.push({
              name: file,
              path: `${directory}/${file}`,
              size: stats.size,
              modified: stats.mtime.toISOString(),
            });
          }
        }

        res.json({ files: fileList });
      } catch (dirError) {
        res.status(404).json({ error: `Directory not found: ${directory}` });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleUploadFile(req, res) {
    try {
      const { filename, content, directory = 'my_content' } = req.body;

      if (!filename || !content) {
        return res.status(400).json({
          error: 'filename and content are required',
        });
      }

      const basePath = join(__dirname, '../../', directory);
      const filePath = join(basePath, filename);

      // Ensure directory exists
      await fs.mkdir(basePath, { recursive: true });

      // Write file
      await fs.writeFile(filePath, content, 'utf8');

      res.json({
        message: 'File uploaded successfully',
        path: `${directory}/${filename}`,
        size: content.length,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async start() {
    this.server = this.app.listen(this.port, () => {
      console.log(
        `🌐 SPOT API Server running on http://localhost:${this.port}`
      );
      console.log(
        `📖 API Documentation available at http://localhost:${this.port}/api/v1/info`
      );
      console.log(
        `🏥 Health check available at http://localhost:${this.port}/health`
      );
    });
  }
}

// Main execution
async function main() {
  const server = new SPOTAPIServer();
  await server.initialize();
  await server.start();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SPOTAPIServer };
