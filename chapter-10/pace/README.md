# PACE (Prompt-Augmented Coding Environment)

PACE is an innovative code editor that combines the power of CodeMirror with AI-driven prompt templates. It allows developers to create custom prompt templates and apply them to selected code snippets, enhancing productivity through AI assistance.

## Features

- **CodeMirror Integration**: Full-featured code editor with syntax highlighting
- **Custom Prompt Templates**: Create and manage prompt templates with `{{selection}}` variables
- **AI-Powered Completions**: Send prompts to an LLM backend for intelligent code assistance
- **Template Management**: Add, edit, and organize prompt templates through an intuitive interface
- **Real-time Processing**: Get instant AI-generated responses for your code selections

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key (or compatible LLM service)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd pace
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file and add your OpenAI API key:

   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Writing Code**: Use the CodeMirror editor to write your code
2. **Creating Prompt Templates**: Click "Add an AI Feature" to create new prompt templates
3. **Using Templates**: Select text in the editor and choose a template from the dropdown
4. **AI Processing**: The selected text is processed by the AI and results are displayed

## Architecture

- **Frontend**: HTML, CSS, JavaScript with CodeMirror
- **Backend**: Node.js with Express
- **AI Integration**: OpenAI API (configurable for other providers)

## License

MIT License
