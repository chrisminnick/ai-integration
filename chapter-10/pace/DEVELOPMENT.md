# PACE Development Setup Guide

## Quick Start

1. **Clone and Setup**:

   ```bash
   cd chapter-10/pace
   npm install
   ```

2. **Configure API Key**:

   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Start the Application**:

   ```bash
   ./start.sh
   # Or manually: npm start
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:3000`

## Features Overview

### Core Components

1. **CodeMirror Editor**:

   - Syntax highlighting for multiple languages
   - Line numbers, bracket matching
   - Text selection for AI processing

2. **Template System**:

   - Create custom prompt templates
   - Use `{{selection}}` placeholder for selected code
   - Manage templates through the UI

3. **AI Integration**:

   - OpenAI GPT integration
   - Configurable model and temperature
   - Error handling and loading states

4. **User Interface**:
   - Responsive design
   - Modal dialogs for template creation
   - Real-time results display

### Default Templates

The application comes with four pre-built templates:

1. **Explain Code**: Explains what selected code does
2. **Add Comments**: Adds helpful comments to code
3. **Optimize Code**: Suggests optimizations and improvements
4. **Fix Bugs**: Identifies and fixes potential bugs

### Usage Workflow

1. **Write or paste code** in the editor
2. **Select text** you want to process
3. **Choose a template** from the dropdown
4. **Click "Apply Template"** or press Ctrl/Cmd+Enter
5. **View AI results** in the right panel

## Architecture

```
PACE/
├── server.js              # Express backend server
├── public/
│   ├── index.html        # Main application HTML
│   ├── styles.css        # Application styles
│   └── app.js           # Frontend JavaScript
├── package.json          # Dependencies and scripts
├── .env.example         # Environment template
└── README.md            # Documentation
```

### Backend API Endpoints

- `GET /api/templates` - Retrieve all templates
- `POST /api/templates` - Create new template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/complete` - Process AI completion

### Frontend Classes

- `PACEApp` - Main application controller
- Template management
- Editor integration
- UI event handling

## Customization

### Adding New Templates

Templates must include `{{selection}}` placeholder:

```javascript
{
  name: "Custom Template",
  description: "Description of what it does",
  template: "Your prompt here with {{selection}} placeholder"
}
```

### Changing AI Provider

Modify the `processAICompletion` function in `server.js` to use different AI services.

### Styling

Edit `public/styles.css` to customize the appearance. The design uses:

- CSS Grid for layout
- Flexbox for components
- CSS custom properties for theming
- Responsive design patterns

## Development Tips

1. **Hot Reload**: Use `npm run dev` with nodemon for auto-restart
2. **Debugging**: Check browser console and server logs
3. **Testing**: Try different code selections and templates
4. **API Limits**: Be mindful of OpenAI API rate limits

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Open "Add AI Feature" modal
- `Ctrl/Cmd + Enter`: Apply selected template
- `Escape`: Close modal dialogs

## Troubleshooting

### Common Issues

1. **API Key Not Set**: Ensure `.env` file has valid OpenAI API key
2. **Network Errors**: Check internet connection and API status
3. **Template Not Working**: Verify `{{selection}}` placeholder exists
4. **No Selection**: Must select text before applying templates

### Error Messages

The application provides user-friendly error messages for:

- Missing API configuration
- Network connectivity issues
- Invalid template formats
- AI service errors

## Extension Ideas

- **Multiple AI Providers**: Support for Anthropic, Google, etc.
- **Template Sharing**: Export/import template collections
- **Code History**: Track and replay AI interactions
- **Collaborative Features**: Share sessions with team members
- **Plugin System**: Custom template types and processors
- **Version Control**: Integration with Git for AI-assisted commits
- **Language Server**: Add autocomplete and error checking
