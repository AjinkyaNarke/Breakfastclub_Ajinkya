# Engineering Manager

## Overview
This system takes Product Requirements Documents (PRDs) and generates comprehensive task lists with subtasks divided between **Claude Code** (backend) and **Cursor Agent** (frontend). It manages the complete implementation lifecycle from task generation to completion tracking.

## Workflow Process

### Phase 1: PRD Analysis & Task Generation

#### Step 1: Receive PRD Reference
- User provides path to specific PRD file
- AI reads and analyzes the functional requirements, user stories, and technical specifications

#### Step 2: Generate Parent Tasks
- Create 5-7 high-level parent tasks based on PRD analysis
- Present tasks in the specified format (without subtasks initially)
- Inform user: "I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with 'Go' to proceed."

#### Step 3: Wait for Confirmation
- Pause and wait for user to respond with "Go"
- Do not proceed to subtask generation without explicit confirmation

#### Step 4: Generate Detailed Subtasks
- Break down each parent task into actionable subtasks
- **Assign each subtask to either:**
  - `[CLAUDE_CODE]` - Backend development tasks
  - `[CURSOR_AGENT]` - Frontend development tasks
- Ensure logical flow and dependencies between tasks

#### Step 5: Identify Relevant Files
- List potential files to be created/modified
- Include corresponding test files
- Organize by backend/frontend structure

#### Step 6: Save Task List
- Save as `/tasks/tasks-[prd-file-name].md`
- Use base name of input PRD file

## Task Assignment Guidelines

### Claude Code (Backend) Tasks
- API endpoint development
- Database schema and migrations
- Business logic implementation
- Server-side validation
- Authentication/authorization
- Background jobs and workers
- Integration with external services
- Backend testing (unit, integration)
- Performance optimization
- Security implementations

### Cursor Agent (Frontend) Tasks
- UI component development
- State management
- Client-side routing
- Form handling and validation
- API integration and data fetching
- Responsive design implementation
- Frontend testing (unit, E2E)
- Accessibility features
- Performance optimization (loading, caching)
- User experience enhancements

## Task List Template

```markdown
# Task List: [Feature Name]
**Based on PRD:** `[prd-file-path]`
**Generated:** [timestamp]

## High-Level Tasks

### Task 1: [Parent Task Name]
**Assigned to:** Mixed (Backend + Frontend)
**Description:** [Brief description of what this accomplishes]

#### Subtasks:
- [ ] `[CLAUDE_CODE]` [Backend subtask description]
- [ ] `[CLAUDE_CODE]` [Another backend subtask]
- [ ] `[CURSOR_AGENT]` [Frontend subtask description]
- [ ] `[CURSOR_AGENT]` [Another frontend subtask]

### Task 2: [Parent Task Name]
**Assigned to:** [Backend/Frontend/Mixed]
**Description:** [Brief description]

#### Subtasks:
- [ ] `[ASSIGNMENT]` [Subtask description]
- [ ] `[ASSIGNMENT]` [Subtask description]

[Continue for all parent tasks...]

## Relevant Files

### Backend Files (Claude Code)
- `path/to/file.py` - [Description of purpose]
- `path/to/test_file.py` - [Test file description]

### Frontend Files (Cursor Agent)
- `path/to/component.tsx` - [Description of purpose]
- `path/to/test_component.test.tsx` - [Test file description]

### Shared/Config Files
- `path/to/config.json` - [Description]

## Implementation Notes
- [Any important considerations]
- [Dependencies between tasks]
- [Special requirements]
```

## Task Implementation Protocol

### One Subtask at a Time Rule
- **CRITICAL:** Implement only ONE subtask at a time
- After completing a subtask, ask user: "Subtask completed. Ready for the next one? (y/n)"
- Wait for explicit permission before proceeding

### Completion Protocol

#### When a Subtask is Finished:
1. **Mark Complete:** Change `[ ]` to `[x]` in the task list
2. **Update Relevant Files:** Add any new files created or modified
3. **Ask for Permission:** "Subtask completed. Ready for the next one? (y/n)"

#### When ALL Subtasks Under a Parent Task are Complete:
1. **Run Tests:** Execute full test suite based on project type:
   - Python: `pytest`
   - Node.js: `npm test`
   - Rails: `bin/rails test`
   - etc.
2. **Only if tests pass:**
   - Stage changes: `git add .`
   - Clean up temporary files and code
   - Commit with descriptive message using format:
     ```bash
     git commit -m "feat: [parent task summary]" -m "- [key change 1]" -m "- [key change 2]" -m "Related to [task ID] in PRD"
     ```
3. **Mark Parent Task Complete:** Change parent task `[ ]` to `[x]`

### AI Assignment Instructions

#### For Claude Code (Backend):
- Focus on server-side implementation
- Prioritize data integrity and security
- Implement proper error handling
- Write comprehensive tests
- Follow backend best practices
- Handle database operations efficiently

#### For Cursor Agent (Frontend):
- Focus on user interface and experience
- Ensure responsive and accessible design
- Implement proper state management
- Write component and integration tests
- Follow frontend best practices
- Optimize for performance

## Example Task Breakdown

```markdown
### Task 1: User Authentication System
**Assigned to:** Mixed (Backend + Frontend)
**Description:** Implement complete user authentication with login, logout, and session management

#### Subtasks:
- [ ] `[CLAUDE_CODE]` Create User model with email/password fields
- [ ] `[CLAUDE_CODE]` Implement password hashing and validation
- [ ] `[CLAUDE_CODE]` Create authentication middleware
- [ ] `[CLAUDE_CODE]` Build login/logout API endpoints
- [ ] `[CLAUDE_CODE]` Write authentication tests
- [ ] `[CURSOR_AGENT]` Create login form component
- [ ] `[CURSOR_AGENT]` Implement authentication state management
- [ ] `[CURSOR_AGENT]` Build protected route wrapper
- [ ] `[CURSOR_AGENT]` Add login/logout UI flows
- [ ] `[CURSOR_AGENT]` Write frontend authentication tests
```

## Quality Standards

### Before Marking Any Task Complete:
- [ ] All tests are passing
- [ ] Code follows project conventions
- [ ] No console errors or warnings
- [ ] Proper error handling implemented
- [ ] Documentation updated if needed
- [ ] Performance impact considered

### Git Commit Standards:
- Use conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
- Include clear description of changes
- Reference task numbers and PRD context
- Keep commits atomic and focused

## File Management
- Keep task list file updated in real-time
- Maintain accurate "Relevant Files" section
- Add newly discovered files as they emerge
- Remove or mark deprecated files

Remember: The goal is systematic, trackable progress with clear division of responsibilities between backend and frontend development, ensuring quality through testing and proper version control.
