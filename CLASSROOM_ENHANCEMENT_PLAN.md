# Classroom Live Session Enhancement Plan

## Objective
Enhance the MathSophos classroom live session to match Google Meet's functionality level.

## Current State Analysis
The current implementation has:
- ✅ Basic video/audio controls with device selection
- ✅ Screen sharing
- ✅ Text chat
- ✅ Participants list
- ✅ Emoji reactions
- ✅ Local recording
- ✅ Gallery and Speaker views
- ✅ Connection quality indicators
- ⚠️ Security settings (UI only, not enforced)

## Missing Features to Implement

### Priority 1: Essential Features
1. **Raise Hand**
   - Add raise hand button
   - Show hand icon on participant tile
   - Notify teacher/host
   - List of raised hands in participants panel

2. **Host Controls** (Teacher-only)
   - Mute specific participant
   - Mute all participants
   - Remove participant from meeting
   - Spotlight participant (force speaker view)
   - End meeting for all

3. **Waiting Room**
   - Implement actual waiting room logic
   - Admit/deny participants
   - Bulk admit all

4. **Meeting Lock**
   - Implement actual lock mechanism
   - Prevent new participants when locked

### Priority 2: Quality & Experience
5. **Background Effects**
   - Background blur
   - Virtual backgrounds (image upload)
   - Use Canvas API or WebGL for processing

6. **Noise Cancellation**
   - Integrate Web Audio API
   - Apply noise suppression filters

7. **Picture-in-Picture**
   - Enable PiP mode for main video
   - Keep controls accessible

8. **Grid Customization**
   - Pin participants
   - Hide self-view
   - Adjust grid size (2x2, 3x3, 4x4)

### Priority 3: Collaboration Tools
9. **Whiteboard**
   - Shared canvas for drawing
   - Math equation support (LaTeX)
   - Save/export whiteboard

10. **Polls**
    - Create quick polls
    - Real-time results
    - Multiple choice/yes-no

11. **File Sharing**
    - Share files in chat
    - Preview PDFs/images

### Priority 4: Advanced Features
12. **Live Captions**
    - Speech-to-text using Web Speech API
    - Display captions overlay

13. **Breakout Rooms**
    - Create sub-rooms
    - Auto-assign or manual
    - Timer and broadcast messages

14. **Recording Enhancements**
    - Cloud recording (server-side)
    - Recording indicators for all
    - Automatic transcription

15. **Analytics**
    - Attendance tracking
    - Participation metrics
    - Engagement analytics

## Implementation Strategy

### Phase 1: Core Functionality (Week 1)
- Raise hand feature
- Host controls (mute, remove, spotlight)
- Waiting room implementation
- Meeting lock implementation

### Phase 2: Quality Improvements (Week 2)
- Background blur
- Noise cancellation
- PiP mode
- Grid customization

### Phase 3: Collaboration (Week 3)
- Whiteboard with LaTeX support
- Polls
- File sharing

### Phase 4: Advanced (Week 4)
- Live captions
- Breakout rooms
- Cloud recording
- Analytics dashboard

## Technical Considerations

### LiveKit Features to Leverage
- Data messages for signaling (raise hand, polls)
- Room metadata for settings
- Participant permissions
- Track subscriptions for bandwidth optimization

### New Dependencies Needed
- `@tensorflow/tfjs` - For background effects
- `fabric.js` or `konva` - For whiteboard
- `katex` - Already have, use for math on whiteboard
- `pdfjs-dist` - For PDF preview

### Database Schema Updates
```sql
-- Classroom sessions
ALTER TABLE classrooms ADD COLUMN settings JSONB;

-- Session recordings
CREATE TABLE classroom_recordings (
  id UUID PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  file_url TEXT,
  transcript TEXT
);

-- Polls
CREATE TABLE classroom_polls (
  id UUID PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id),
  question TEXT,
  options JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);

-- Poll responses
CREATE TABLE poll_responses (
  id UUID PRIMARY KEY,
  poll_id UUID REFERENCES classroom_polls(id),
  user_id UUID REFERENCES users(id),
  option_index INTEGER,
  created_at TIMESTAMP
);
```

## UI/UX Improvements
1. **Toolbar Organization**
   - Group related controls
   - Add tooltips with keyboard shortcuts
   - Responsive design for mobile

2. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

3. **Performance**
   - Lazy load components
   - Optimize re-renders
   - Virtual scrolling for large participant lists

## Success Metrics
- Feature parity with Google Meet: 90%+
- User satisfaction: 4.5/5 stars
- Performance: <100ms latency for controls
- Stability: <1% disconnection rate
