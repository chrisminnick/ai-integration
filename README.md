# A Developer's Guide to Integrating AI into Applications

<div align="center">

<img src="9781394373130-cover.jpg" alt="A Developer's Guide to Integrating AI into Applications - Book Cover" width="300">

**Code Examples and Demos**

[![Book](https://img.shields.io/badge/Wiley-2026-blue)](https://www.wiley.com)
[![ISBN](https://img.shields.io/badge/ISBN-9781394373130-green)](https://www.wiley.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Chris%20Minnick-orange)](https://github.com/chrisminnick)

</div>

## 📖 About This Book

This repository contains **all the code examples, demos, and hands-on projects from every chapter** of **"A Developer's Guide to Integrating Generative AI into Applications"** by Chris Minnick, published by Wiley Publishing in 2026.

The book provides practical guidance for software developers who want to integrate AI capabilities into their applications, covering everything from basic API integration to advanced techniques like RAG (Retrieval-Augmented Generation), vector search, production-ready AI systems, cost optimization, and advanced orchestration patterns.

### Book Details

- **Title**: A Developer's Guide to Integrating Generative AI into Applications
- **Author**: Chris Minnick
- **Publisher**: Wiley Publishing
- **Publication Year**: 2026
- **ISBN**: 9781394373130

## 🚀 What's Inside

This repository contains **complete code examples from every chapter** and is organized by chapter with working examples of:

- **AI API Integration** - OpenAI, Anthropic, and Google Gemini integrations
- **Interactive Games** - 20 Questions, Choose Your Adventure, and Hangman powered by AI
- **Chat Applications** - Full-stack chat implementations with streaming
- **Content Generation** - Structured output and template-based generation
- **Code Optimization** - AI-assisted coding environments and optimization techniques
- **Production Tools** - PACE (Prompt-Augmented Coding Environment) for enterprise development
- **Vector Search** - Embedding-based search and recommendation systems
- **RAG Systems** - Retrieval-Augmented Generation implementations
- **AI Safety & Moderation** - Content filtering and feedback systems
- **Cost Management** - Usage tracking, quotas, and cost optimization
- **Advanced Routing** - Multi-modal adapters and intelligent request orchestration

## 📁 Repository Structure

```
├── chapter-02/          # RAG (Retrieval-Augmented Generation) concepts
├── chapter-03/          # Interactive AI games and demos
│   ├── 20-questions/    # AI-powered 20 Questions game
│   ├── choose-your-adventure/  # Interactive story game
│   └── hangman/         # AI word guessing game
├── chapter-04/          # Structured content generation
├── chapter-05/          # Recipe generator with Node.js
├── chapter-07/          # AI optimization examples and techniques
├── chapter-08/          # Chat applications
│   ├── simple-chat-python/     # Flask-based chat server
│   ├── chat-client-react-*/    # React chat clients
│   └── simple-chat-server-*/   # Node.js chat servers
├── chapter-09/          # Production AI tools
├── chapter-10/          # AI-assisted coding
│   └── pace/            # Prompt-Augmented Coding Environment
├── chapter-11/          # Vector search and recommendations
│   ├── vector-search-demo/     # Embedding-based search
│   ├── recommender-demo/       # AI recommendation system
│   └── fuse/                   # Advanced search implementation
├── chapter-12/          # AI safety, moderation and feedback systems
├── chapter-13/          # Cost optimization, usage tracking and quotas
└── chapter-14/          # AI routing, orchestration and multi-modal adapters
```

## 🛠️ Technologies Used

- **Languages**: Python, JavaScript/Node.js, TypeScript
- **Frameworks**: Flask, Express.js, React, Vite
- **AI Providers**: OpenAI GPT, Anthropic Claude, Google Gemini
- **Databases**: Vector databases, JSON storage
- **Tools**: CodeMirror, various AI SDKs

## 🎯 Featured Projects

### PACE (Prompt-Augmented Coding Environment)

_Chapter 10_

An AI-enhanced code editor that combines CodeMirror with customizable AI prompt templates for developer productivity.

### AI Safety & Moderation Systems

_Chapter 12_

Production-ready implementations featuring:

- Content moderation and filtering
- Feedback collection and analysis systems
- Safe AI interaction patterns
- Real-time monitoring and alerting

### Cost Optimization Suite

_Chapter 13_

Enterprise-grade tools for AI cost management:

- Real-time usage tracking and analytics
- Token counting and cost estimation
- Quota enforcement and rate limiting
- Usage summarization and reporting

### Interactive AI Games

_Chapter 3_

- **20 Questions**: AI acts as the answerer in the classic guessing game
- **Choose Your Adventure**: AI-generated interactive stories with branching narratives
- **Hangman**: AI provides words and hints for the classic word game

### Chat Applications

_Chapter 8_

Complete implementations showing:

- Real-time streaming responses
- Session management
- Full-stack architecture (Python Flask + React)
- WebSocket integration

### Vector Search & Recommendations

_Chapter 11_

- Embedding-based search systems
- User profile-driven recommendations
- Advanced search with the Fuse.js library

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- API keys for at least one AI provider:
  - [OpenAI API Key](https://platform.openai.com/)
  - [Anthropic API Key](https://console.anthropic.com/)
  - [Google AI API Key](https://makersuite.google.com/)

### Quick Start

1. **Clone the repository**:

   ```bash
   git clone https://github.com/chrisminnick/ai-integration.git
   cd ai-integration
   ```

2. **Set up environment variables**:

   ```bash
   # Copy the example environment file (if available in specific chapters)
   export OPENAI_API_KEY="your-openai-api-key"
   export ANTHROPIC_API_KEY="your-anthropic-api-key"
   export GOOGLE_AI_API_KEY="your-google-ai-api-key"
   ```

3. **Run a demo** (example - 20 Questions game):

   ```bash
   cd chapter-03/20-questions
   pip install -r requirements.txt
   python server.py
   ```

4. **Visit** `http://localhost:5000` to try the demo

### Chapter-Specific Setup

Each chapter folder contains its own `README.md` with specific setup instructions. Most Python projects include a `requirements.txt` file, and Node.js projects include a `package.json` file for dependency management.

## 📚 Learning Path

If you're new to AI integration, we recommend following this order:

1. **Chapter 3** - Start with the interactive games to understand basic AI API calls
2. **Chapter 4** - Learn structured output and content generation
3. **Chapter 5** - Explore Node.js integration patterns
4. **Chapter 8** - Build full-stack chat applications
5. **Chapter 7** - Optimize performance and implement caching
6. **Chapter 10** - Enhance development workflow with PACE
7. **Chapter 11** - Implement advanced search and recommendations
8. **Chapter 12** - Add safety and moderation to your AI systems
9. **Chapter 13** - Implement cost monitoring and usage optimization
10. **Chapter 14** - Master advanced routing and multi-modal orchestration

## 🤝 Contributing

This repository primarily serves as companion code for the book, but we welcome:

- Bug reports and fixes
- Documentation improvements
- Additional examples or variations
- Performance optimizations

Please see individual project READMEs for specific contribution guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support

- **Book Support**: Contact Wiley Publishing for book-related questions
- **Code Issues**: Open an issue in this GitHub repository
- **Author Contact**: [Chris Minnick](https://github.com/chrisminnick)

## 🔗 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Google AI API Documentation](https://ai.google.dev/)
- [Wiley Publishing](https://www.wiley.com/)

## ⚖️ Copyright & License

### Book Copyright

**"A Developer's Guide to Integrating Generative AI into Applications"**  
© 2026 Wiley Publishing. All rights reserved.

### Code License

The code examples and demonstrations in this repository are open source and licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.

**The book and its content are protected by copyright.** The code examples are provided for educational purposes to accompany the book and may be used, modified, and distributed under the terms of the MIT License.

---

<div align="center">

**Happy Coding! 🤖✨**

_Built with ❤️ for developers integrating AI into their applications_

</div>
