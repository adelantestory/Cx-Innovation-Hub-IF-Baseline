# Taskify - Product Description

## Overview

Taskify is a team productivity platform designed to enable users to collaborate on projects through task management and team coordination.

## Core Features

### Project Management
- Create and manage multiple projects
- Add team members to projects
- View organized list of projects on launch

### Task Management
- Assign tasks to team members
- Move tasks between workflow stages using Kanban-style board
- Leave unlimited comments on individual tasks
- Edit and delete own comments (read-only access to others' comments)

### Kanban Board
- Standard workflow columns:
  - To Do
  - In Progress
  - In Review
  - Done
- Drag-and-drop task cards between columns
- Visual highlighting of tasks assigned to the current user

## User Management

### User Setup
- Five predefined users with no login required
- Two user categories:
  - 1 Product Manager
  - 4 Engineers
- User selection on application launch

### User Experience
- Select user from dropdown list on startup
- Users can assign tasks to any of the five valid users
- Visual distinction (different color) for tasks assigned to the current user

## Initial Phase - "Create Taskify"

### Sample Data
- 5 predefined users
- 3 sample projects
- Pre-configured Kanban boards

### Technical Notes
- No authentication/password required for MVP
- No login system (user selection only)
- All users have full access to all projects and commenting features

## Interaction Rules

### Task Management
- Any user can change task status across columns
- Any user can assign tasks to other users

### Comments
- Unlimited comments per task
- Users can edit only their own comments
- Users can delete only their own comments
- Comment visibility is read-only restricted (cannot edit/delete others' comments)
Develop Taskify, a team productivity platform. It should allow users to create projects, add team members,
assign tasks, comment and move tasks between boards in Kanban style. In this initial phase for this feature,
let's call it "Create Taskify," let's have multiple users but the users will be declared ahead of time, predefined.
I want five users in two different categories, one product manager and four engineers. Let's create three
different sample projects. Let's have the standard Kanban columns for the status of each task, such as "To Do,"
"In Progress," "In Review," and "Done." There will be no login for this application as this is just the very
first testing thing to ensure that our basic features are set up. For each task in the UI for a task card,
you should be able to change the current status of the task between the different columns in the Kanban work board.
You should be able to leave an unlimited number of comments for a particular card. You should be able to, from that task
card, assign one of the valid users. When you first launch Taskify, it's going to give you a list of the five users to pick
from. There will be no password required. When you click on a user, you go into the main view, which displays the list of
projects. When you click on a project, you open the Kanban board for that project. You're going to see the columns.
You'll be able to drag and drop cards back and forth between different columns. You will see any cards that are
assigned to you, the currently logged in user, in a different color from all the other ones, so you can quickly
see yours. You can edit any comments that you make, but you can't edit comments that other people made. You can
delete any comments that you made, but you can't delete comments anybody else made.
