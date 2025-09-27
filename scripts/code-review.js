#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class CodeReviewer {
  constructor(focus = 'general') {
    this.focus = focus;
    this.issues = [];
    this.suggestions = [];
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  addIssue(type, severity, file, line, message) {
    this.issues.push({ type, severity, file, line, message });
  }

  addSuggestion(category, file, message) {
    this.suggestions.push({ category, file, message });
  }

  reviewFile(filePath) {
    if (!fs.existsSync(filePath)) {
      this.log(`File not found: ${filePath}`, 'red');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const ext = path.extname(filePath);

    this.log(`\n📋 Reviewing: ${filePath}`, 'cyan');

    // General code quality checks
    this.checkGeneralQuality(filePath, content, lines);

    // File-specific checks based on extension
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      this.reviewJavaScript(filePath, content, lines);
    }

    if (['.jsx', '.tsx'].includes(ext)) {
      this.reviewReact(filePath, content, lines);
    }

    if (ext === '.scss' || ext === '.css') {
      this.reviewStyles(filePath, content, lines);
    }
  }

  checkGeneralQuality(filePath, content, lines) {
    // Check for TODO/FIXME comments
    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        this.addIssue('maintenance', 'info', filePath, index + 1, 
          'TODO/FIXME comment found - consider addressing');
      }
    });

    // Check for console.log statements
    lines.forEach((line, index) => {
      if (line.includes('console.log') && !line.trim().startsWith('//')) {
        this.addIssue('debug', 'warning', filePath, index + 1, 
          'console.log statement found - remove before production');
      }
    });

    // Check file size
    if (lines.length > 300) {
      this.addSuggestion('structure', filePath, 
        `File is ${lines.length} lines long - consider breaking into smaller modules`);
    }
  }

  reviewJavaScript(filePath, content, lines) {
    // Check for var usage
    lines.forEach((line, index) => {
      if (line.includes('var ') && !line.trim().startsWith('//')) {
        this.addIssue('syntax', 'warning', filePath, index + 1, 
          'Use const/let instead of var');
      }
    });

    // Check for == instead of ===
    lines.forEach((line, index) => {
      if ((line.includes('==') && !line.includes('===')) && !line.trim().startsWith('//')) {
        this.addIssue('syntax', 'warning', filePath, index + 1, 
          'Use strict equality (===) instead of loose equality (==)');
      }
    });

    // Check for missing error handling in async functions
    if (content.includes('async ') && !content.includes('try') && !content.includes('catch')) {
      this.addSuggestion('error-handling', filePath, 
        'Async function without error handling - consider adding try/catch');
    }

    // Security-focused checks
    if (this.focus === 'security' || this.focus === 'general') {
      this.reviewSecurity(filePath, content, lines);
    }

    // Performance-focused checks
    if (this.focus === 'performance' || this.focus === 'general') {
      this.reviewPerformance(filePath, content, lines);
    }
  }

  reviewReact(filePath, content, lines) {
    // Check for missing keys in lists
    lines.forEach((line, index) => {
      if (line.includes('.map(') && !content.includes('key=')) {
        this.addIssue('react', 'warning', filePath, index + 1, 
          'Missing key prop in list rendering');
      }
    });

    // Check for inline styles
    lines.forEach((line, index) => {
      if (line.includes('style={{')) {
        this.addSuggestion('performance', filePath, 
          'Inline styles found - consider using CSS classes for better performance');
      }
    });

    // Accessibility checks
    if (this.focus === 'accessibility' || this.focus === 'general') {
      this.reviewAccessibility(filePath, content, lines);
    }
  }

  reviewSecurity(filePath, content, lines) {
    // Check for potential XSS vulnerabilities
    if (content.includes('dangerouslySetInnerHTML')) {
      this.addIssue('security', 'high', filePath, 0, 
        'dangerouslySetInnerHTML usage - ensure content is sanitized');
    }

    // Check for hardcoded secrets
    lines.forEach((line, index) => {
      if (line.includes('password') || line.includes('secret') || line.includes('key')) {
        if (line.includes('=') && !line.includes('process.env')) {
          this.addIssue('security', 'high', filePath, index + 1, 
            'Potential hardcoded secret - use environment variables');
        }
      }
    });
  }

  reviewPerformance(filePath, content, lines) {
    // Check for unnecessary re-renders
    if (content.includes('useEffect') && !content.includes('useMemo') && 
        !content.includes('useCallback')) {
      this.addSuggestion('performance', filePath, 
        'Consider using useMemo/useCallback to optimize re-renders');
    }

    // Check for large bundle imports
    lines.forEach((line, index) => {
      if (line.includes('import') && line.includes('*')) {
        this.addIssue('performance', 'warning', filePath, index + 1, 
          'Wildcard import - consider importing only needed modules');
      }
    });
  }

  reviewAccessibility(filePath, content, lines) {
    // Check for missing alt attributes
    lines.forEach((line, index) => {
      if (line.includes('<img') && !line.includes('alt=')) {
        this.addIssue('accessibility', 'warning', filePath, index + 1, 
          'Image missing alt attribute');
      }
    });

    // Check for missing form labels
    lines.forEach((line, index) => {
      if (line.includes('<input') && !line.includes('aria-label') && 
          !content.includes('<label')) {
        this.addIssue('accessibility', 'warning', filePath, index + 1, 
          'Input missing label or aria-label');
      }
    });
  }

  reviewStyles(filePath, content, lines) {
    // Check for !important usage
    lines.forEach((line, index) => {
      if (line.includes('!important')) {
        this.addIssue('css', 'warning', filePath, index + 1, 
          '!important usage - consider refactoring CSS specificity');
      }
    });
  }

  generateReport() {
    this.log('\n🔍 CODE REVIEW REPORT', 'bright');
    this.log('='.repeat(50), 'blue');

    if (this.issues.length === 0 && this.suggestions.length === 0) {
      this.log('\n✅ No issues found! Code looks good.', 'green');
      return;
    }

    // Group issues by severity
    const critical = this.issues.filter(i => i.severity === 'critical');
    const high = this.issues.filter(i => i.severity === 'high');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const info = this.issues.filter(i => i.severity === 'info');

    if (critical.length > 0) {
      this.log('\n🚨 CRITICAL ISSUES:', 'red');
      critical.forEach(issue => this.printIssue(issue, 'red'));
    }

    if (high.length > 0) {
      this.log('\n⚠️  HIGH PRIORITY:', 'yellow');
      high.forEach(issue => this.printIssue(issue, 'yellow'));
    }

    if (warnings.length > 0) {
      this.log('\n⚡ WARNINGS:', 'yellow');
      warnings.forEach(issue => this.printIssue(issue, 'yellow'));
    }

    if (info.length > 0) {
      this.log('\nℹ️  INFO:', 'blue');
      info.forEach(issue => this.printIssue(issue, 'blue'));
    }

    if (this.suggestions.length > 0) {
      this.log('\n💡 SUGGESTIONS:', 'cyan');
      this.suggestions.forEach(suggestion => {
        this.log(`  • ${suggestion.file}: ${suggestion.message}`, 'cyan');
      });
    }

    // Summary
    this.log('\n📊 SUMMARY:', 'bright');
    this.log(`  Total Issues: ${this.issues.length}`, 'white');
    this.log(`  Suggestions: ${this.suggestions.length}`, 'white');
    this.log(`  Focus: ${this.focus}`, 'white');
  }

  printIssue(issue, color) {
    this.log(`  • ${issue.file}:${issue.line} - ${issue.message}`, color);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  let focus = 'general';
  let targetPath = '.';

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--focus=')) {
      focus = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      targetPath = arg;
    }
  });

  const reviewer = new CodeReviewer(focus);
  
  reviewer.log('🔍 Starting Code Review...', 'bright');
  reviewer.log(`Focus: ${focus}`, 'cyan');
  reviewer.log(`Target: ${targetPath}`, 'cyan');

  // Determine if target is file or directory
  if (fs.statSync(targetPath).isFile()) {
    reviewer.reviewFile(targetPath);
  } else {
    // Review common file types in the directory
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.scss', '.css'];
    const files = fs.readdirSync(targetPath)
      .filter(file => extensions.includes(path.extname(file)))
      .slice(0, 10); // Limit to first 10 files to avoid overwhelming output

    if (files.length === 0) {
      reviewer.log('No reviewable files found in directory', 'yellow');
      return;
    }

    files.forEach(file => {
      reviewer.reviewFile(path.join(targetPath, file));
    });
  }

  reviewer.generateReport();
}

if (require.main === module) {
  main();
}

module.exports = CodeReviewer;
