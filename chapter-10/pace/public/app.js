// PACE Application - Main JavaScript File
class PACEApp {
  constructor() {
    this.editor = null;
    this.templates = [];
    this.selectedText = '';
    this.init();
  }

  async init() {
    this.setupEditor();
    this.setupEventListeners();
    await this.loadTemplates();
    this.updateUI();
  }

  // Initialize CodeMirror editor
  setupEditor() {
    const textarea = document.getElementById('codeEditor');
    this.editor = CodeMirror.fromTextArea(textarea, {
      mode: 'javascript',
      theme: 'monokai',
      lineNumbers: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      indentUnit: 4,
      indentWithTabs: false,
      showCursorWhenSelecting: true,
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
      },
    });

    // Handle text selection
    this.editor.on('cursorActivity', () => {
      this.handleSelection();
    });

    // Set initial content
    this.editor
      .setValue(`// Welcome to PACE - Prompt-Augmented Coding Environment
// Select some code and try the AI features!

function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`);
  }

  // Set up all event listeners
  setupEventListeners() {
    // Add AI Feature button
    document.getElementById('addFeatureBtn').addEventListener('click', () => {
      this.showAddFeatureModal();
    });

    // Template selector
    document
      .getElementById('templateSelect')
      .addEventListener('change', (e) => {
        const applyBtn = document.getElementById('applyTemplateBtn');
        applyBtn.disabled = !e.target.value || !this.selectedText;
      });

    // Apply template button
    document
      .getElementById('applyTemplateBtn')
      .addEventListener('click', () => {
        this.applyTemplate();
      });

    // Language selector
    document
      .getElementById('languageSelect')
      .addEventListener('change', (e) => {
        this.changeEditorMode(e.target.value);
      });

    // Clear results button
    document.getElementById('clearResultsBtn').addEventListener('click', () => {
      this.clearResults();
    });

    // Modal controls
    const modal = document.getElementById('addFeatureModal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('addFeatureForm');

    closeBtn.addEventListener('click', () => this.hideAddFeatureModal());
    cancelBtn.addEventListener('click', () => this.hideAddFeatureModal());

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideAddFeatureModal();
      }
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddFeature(e);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            this.showAddFeatureModal();
            break;
          case 'Enter':
            if (
              this.selectedText &&
              document.getElementById('templateSelect').value
            ) {
              e.preventDefault();
              this.applyTemplate();
            }
            break;
        }
      }

      if (e.key === 'Escape') {
        this.hideAddFeatureModal();
      }
    });
  }

  // Handle text selection in the editor
  handleSelection() {
    const selection = this.editor.getSelection();
    this.selectedText = selection.trim();

    const templateSelect = document.getElementById('templateSelect');
    const applyBtn = document.getElementById('applyTemplateBtn');

    if (this.selectedText) {
      templateSelect.disabled = false;
      if (templateSelect.value) {
        applyBtn.disabled = false;
      }
      // Update placeholder text
      templateSelect.querySelector(
        'option[value=""]'
      ).textContent = `Apply to "${this.selectedText.substring(0, 30)}${
        this.selectedText.length > 30 ? '...' : ''
      }"`;
    } else {
      templateSelect.disabled = true;
      applyBtn.disabled = true;
      templateSelect.querySelector('option[value=""]').textContent =
        'Select text first...';
    }
  }

  // Change editor language mode
  changeEditorMode(language) {
    const modeMap = {
      javascript: 'javascript',
      python: 'python',
      java: 'text/x-java',
      cpp: 'text/x-c++src',
      html: 'xml',
      css: 'css',
      sql: 'sql',
    };

    const mode = modeMap[language] || 'javascript';
    this.editor.setOption('mode', mode);
  }

  // Load templates from the server
  async loadTemplates() {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      this.templates = await response.json();
    } catch (error) {
      console.error('Error loading templates:', error);
      this.showNotification('Error loading templates', 'error');
    }
  }

  // Update the UI with current templates
  updateUI() {
    const templateSelect = document.getElementById('templateSelect');

    // Clear existing options except the first one
    while (templateSelect.children.length > 1) {
      templateSelect.removeChild(templateSelect.lastChild);
    }

    // Add template options
    this.templates.forEach((template) => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      option.title = template.description;
      templateSelect.appendChild(option);
    });
  }

  // Show the add feature modal
  showAddFeatureModal() {
    const modal = document.getElementById('addFeatureModal');
    modal.classList.add('active');

    // Focus on the first input
    setTimeout(() => {
      document.getElementById('featureName').focus();
    }, 100);
  }

  // Hide the add feature modal
  hideAddFeatureModal() {
    const modal = document.getElementById('addFeatureModal');
    modal.classList.remove('active');

    // Clear form
    document.getElementById('addFeatureForm').reset();
  }

  // Handle adding a new feature
  async handleAddFeature(event) {
    const formData = new FormData(event.target);
    const templateData = {
      name: formData.get('name'),
      description: formData.get('description'),
      template: formData.get('template'),
    };

    // Validation
    if (!templateData.template.includes('{{selection}}')) {
      this.showNotification(
        'Template must include {{selection}} placeholder',
        'error'
      );
      return;
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to add template');
      }

      const newTemplate = await response.json();
      this.templates.push(newTemplate);
      this.updateUI();
      this.hideAddFeatureModal();
      this.showNotification(
        `Added "${newTemplate.name}" template successfully!`,
        'success'
      );
    } catch (error) {
      console.error('Error adding template:', error);
      this.showNotification('Error adding template', 'error');
    }
  }

  // Apply the selected template to the selected text
  async applyTemplate() {
    if (!this.selectedText) {
      this.showNotification('Please select some text first', 'warning');
      return;
    }

    const templateId = parseInt(
      document.getElementById('templateSelect').value
    );
    if (!templateId) {
      this.showNotification('Please select a template', 'warning');
      return;
    }

    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      this.showNotification('Template not found', 'error');
      return;
    }

    // Replace the placeholder with selected text
    const prompt = template.template.replace(
      '{{selection}}',
      this.selectedText
    );

    this.showLoading(true);

    try {
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI completion failed');
      }

      const data = await response.json();
      this.displayResult(template, this.selectedText, data.completion);
      this.showNotification('AI completion successful!', 'success');
    } catch (error) {
      console.error('Error getting AI completion:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // Display the AI result
  displayResult(template, originalText, completion) {
    const container = document.getElementById('resultsContainer');

    // Remove placeholder if it exists
    const placeholder = container.querySelector('.placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Create result element
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-item';

    const timestamp = new Date().toLocaleTimeString();

    resultDiv.innerHTML = `
            <div class="result-header">
                <span class="result-template-name">${template.name}</span>
                <span class="result-timestamp">${timestamp}</span>
            </div>
            <div class="result-content">${completion}</div>
        `;

    // Add to top of results
    container.insertBefore(resultDiv, container.firstChild);

    // Scroll to the new result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Clear all results
  clearResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
            <div class="placeholder">
                Select code and apply a template to see AI results here.
            </div>
        `;
  }

  // Show/hide loading indicator
  showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    if (show) {
      loading.classList.add('active');
    } else {
      loading.classList.remove('active');
    }
  }

  // Show notification messages
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '10000',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
    });

    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PACEApp();
});

// Add some helpful keyboard shortcuts info
console.log(`
🚀 PACE - Prompt-Augmented Coding Environment

Keyboard Shortcuts:
• Ctrl/Cmd + K: Add new AI feature
• Ctrl/Cmd + Enter: Apply selected template (when text is selected)
• Escape: Close modal

Tips:
• Select code in the editor to enable template options
• Use {{selection}} in your prompt templates
• Try different programming languages from the dropdown
`);
