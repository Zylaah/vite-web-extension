# Hana Extension Architecture Migration Plan

## Overview
We are restructuring the Hana browser extension to adopt the mature architectural patterns demonstrated by the SolBrowse extension. This migration will improve code organization, add advanced features, and create a more maintainable codebase.

## Current Architecture Issues

### 1. Monolithic Content Script
- `src/pages/content/index.tsx` handles too many responsibilities
- Direct coupling between UI components and background communication
- No proper state management for content scraping
- Limited scalability for new features

### 2. Reactive Architecture
- Content is extracted once on page load
- No real-time content monitoring
- No mutation observers for dynamic content

### 3. Limited Features
- No multi-tab context support
- No conversation persistence per tab
- No content caching or snapshots
- No plugin system for site-specific scrapers

## New Architecture (Based on SolBrowse)

### 1. Controller Pattern
```
ContentScript
├── OverlayController (UI management)
├── ScraperController (content extraction)
└── TabConversationManager (state management)
```

### 2. Background Service Architecture
```
BackgroundScript
├── TabSnapshotManager (content caching)
├── PortManager (communication)
└── PluginScraperRegistry (extensible scraping)
```

### 3. Key Components Created

#### Controllers (`src/lib/controllers/`)
- **OverlayController**: Manages overlay lifecycle, keybinds, and visibility
- **ScraperController**: Handles intelligent content scraping with rate limiting
- **PortManager**: Manages background communication via ports

#### Utilities (`src/lib/utils/`)
- **TabConversationManager**: Per-tab conversation persistence
- **MessageHandler**: Clean inter-component messaging
- **IframeInjector**: Compatibility layer for overlay injection

#### Types (`src/lib/types/`)
- **messaging.ts**: Port-based communication types
- Comprehensive message types for all controller interactions

## Migration Phases

### Phase 1: Foundation (Current)
✅ **Completed**
- [x] Create controller architecture
- [x] Set up messaging types
- [x] Implement TabConversationManager
- [x] Build OverlayController
- [x] Create ScraperController with rate limiting
- [x] Add mutation observers for real-time content tracking

### Phase 2: Content Script Migration
🔄 **In Progress**
- [ ] Replace current content script with controller-based architecture
- [ ] Test overlay functionality with new controllers
- [ ] Ensure keybind management works correctly
- [ ] Verify dark mode integration

### Phase 3: Background Script Enhancement
📋 **Planned**
- [ ] Implement TabSnapshotManager for content caching
- [ ] Add proper port-based communication
- [ ] Create plugin system for site-specific scrapers
- [ ] Add content compression and versioning

### Phase 4: Multi-Tab Features
📋 **Planned**
- [ ] Add tab selection UI to overlay
- [ ] Implement `@tabName` mention syntax
- [ ] Create tab context aggregation
- [ ] Add cross-tab conversation support

### Phase 5: Advanced Features
📋 **Planned**
- [ ] Site-specific scraper plugins (GitHub, Wikipedia, etc.)
- [ ] Content change detection algorithms
- [ ] Debug tools and content inspection
- [ ] Performance optimization

## Key Improvements from SolBrowse

### 1. **Intelligent Content Scraping**
```typescript
// Rate limiting (5 scrapes per minute)
private canScrape(): boolean {
  const maxScrapesPerMinute = 5;
  // ... rate limiting logic
}

// Significant change detection
private hasSignificantContentChange(newContent: string, changeType: string): boolean {
  const percentChange = oldLength > 0 ? lengthDiff / oldLength : 1;
  return percentChange > 0.05 || lengthDiff > 100;
}
```

### 2. **Real-time Content Monitoring**
```typescript
// Mutation observers with smart filtering
private prepareMutationObserver(): void {
  this.mutationObserver = new MutationObserver((mutations) => {
    const significantMutations = mutations.filter(isSignificant);
    if (significantMutations.length > 0) {
      this.performDeltaScrape('mutation');
    }
  });
}
```

### 3. **Per-Tab State Management**
```typescript
// Session-based conversation persistence
export class TabConversationManager {
  private conversationKey: string;
  
  getConversation(): TabConversation {
    const stored = sessionStorage.getItem(this.conversationKey);
    return stored ? JSON.parse(stored) : { messages: [], conversationId: null };
  }
}
```

### 4. **Clean Component Architecture**
```typescript
// Controller coordination
scraper.setOverlayOpenCallback(() => overlay.isVisible());
overlay.setOnOpenCallback(() => scraper.triggerManualScrape());
```

## Testing Strategy

### Phase 1 Testing
1. **Build Extension**: `npm run build:firefox`
2. **Test Controllers**: Verify each controller initializes correctly
3. **Test Communication**: Ensure message bus works between components
4. **Test Scraping**: Verify content extraction and rate limiting

### Phase 2 Testing
1. **Overlay Functionality**: Test show/hide with new controllers
2. **Keybind Management**: Verify Alt+F and Ctrl+Alt+F work correctly
3. **Dark Mode**: Ensure theming works with new architecture
4. **Conversation Persistence**: Test per-tab conversation storage

## Migration Commands

### Switch to New Architecture
```bash
# Backup current content script
mv src/pages/content/index.tsx src/pages/content/index.old.tsx

# Use new controller-based content script
mv src/pages/content/index.new.tsx src/pages/content/index.tsx

# Build and test
npm run build:firefox
```

### Rollback if Needed
```bash
# Restore original content script
mv src/pages/content/index.old.tsx src/pages/content/index.tsx
```

## Benefits of New Architecture

### 1. **Maintainability**
- Separation of concerns between controllers
- Clean interfaces and dependency injection
- Easier testing and debugging

### 2. **Performance**
- Rate-limited content scraping
- Intelligent change detection
- Background processing of content

### 3. **Scalability**
- Plugin system for site-specific scrapers
- Multi-tab context support
- Extensible messaging system

### 4. **User Experience**
- Real-time content updates
- Per-tab conversation history
- Improved error handling and recovery

## Implementation Notes

### Current Compatibility
- All existing features remain functional
- Dark mode integration preserved
- API providers and streaming still work
- Options page functionality unchanged

### New Capabilities
- Real-time content monitoring
- Intelligent scraping with rate limiting
- Better keyboard shortcut management
- Foundation for multi-tab features

### Future Enhancements
- Multi-tab context with `@mentions`
- Site-specific content extraction
- Content caching and compression
- Advanced conversation management

## Conclusion

This migration transforms Hana from a simple overlay extension into a sophisticated AI assistant with real-time content awareness, intelligent scraping, and a scalable architecture that can support advanced features like multi-tab context and site-specific optimizations.

The controller-based architecture provides a solid foundation for future enhancements while maintaining backward compatibility with all existing functionality. 